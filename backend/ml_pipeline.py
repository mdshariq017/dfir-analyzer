import hashlib
import logging
import os
import threading
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# -----------------------------
# Feature schema – must stay consistent with training
# -----------------------------
FEATURE_NAMES: List[str] = [
    "file_size_bytes",
    "entropy",
    "yara_match_count",
    "suspicious_string_count",
    "has_mz_header",
    "has_macro_keywords",
    "has_url",
    "has_base64_chunk",
]

# Global model state (loaded once on startup)
_MODEL: Optional[object] = None
_MODEL_LOCK = threading.Lock()
_MODEL_PATH = Path(__file__).with_name("risk_model.pkl")

# -----------------------------
# Feature extraction helpers
# -----------------------------

def _safe_entropy(data: bytes) -> float:
    """Compute Shannon entropy of file bytes (0–8)."""
    if not data:
        return 0.0
    histogram = np.bincount(np.frombuffer(data, dtype=np.uint8), minlength=256).astype(np.float64)
    probs = histogram / histogram.sum()
    nonzero = probs[probs > 0]
    entropy = -np.sum(nonzero * np.log2(nonzero))
    return float(entropy)


def _scan_suspicious_strings(text: str) -> Dict[str, int]:
    """Regex scan for URLs, base64, macros, and PowerShell keywords."""
    import re
    patterns = {
        "url": r"https?://[^\s\"'<>]+",
        "base64": r"(?:[A-Za-z0-9+/]{40,}={0,2})",
        "macro": r"\b(AutoOpen|Document_Open|AutoExec|ThisDocument|CreateObject\(\"WScript\.Shell\"\))\b",
        "pwsh": r"\b(powershell|EncodedCommand|FromBase64String|Invoke-Mimikatz|cmd\.exe|wscript|cscript)\b",
    }
    counts = {key: 0 for key in ["url", "base64", "macro", "pwsh"]}
    for key, pattern in patterns.items():
        counts[key] = len(re.findall(pattern, text, flags=re.IGNORECASE))
    return counts


def _yara_match_count(data: bytes) -> int:
    """Run simple inline YARA rules, return number of matches. Fail-safe to 0 if yara not installed."""
    try:
        import yara  # type: ignore
        rules_text = r"""
        rule SuspiciousMacro {
            strings: $a = /Auto(Open|Exec)|Document_Open|ThisDocument|WScript\.Shell/i
            condition: any of them
        }
        rule EncodedArtifacts {
            strings: 
                $b64 = /[A-Za-z0-9+\/]{40,}={0,2}/
                $ps1 = /EncodedCommand|FromBase64String|Invoke-Mimikatz/i
            condition: #b64 > 2 or #ps1 > 0
        }"""
        rules = yara.compile(source=rules_text)
        result = rules.match(data=data)
        return len(result)
    except Exception:
        return 0

# -----------------------------
# Main feature extraction
# -----------------------------

def extract_features(file_bytes: bytes, filename: str) -> Dict[str, float]:
    """Convert file bytes into our 8-feature dictionary."""
    try:
        text = file_bytes.decode(errors="ignore")
    except Exception:
        text = ""

    entropy = _safe_entropy(file_bytes)
    size_bytes = len(file_bytes)
    yara_count = _yara_match_count(file_bytes)
    susp = _scan_suspicious_strings(text)

    has_mz_header = 1 if file_bytes[:2] == b"MZ" else 0
    has_macro = 1 if susp.get("macro", 0) > 0 else 0
    has_url = 1 if susp.get("url", 0) > 0 else 0
    has_b64 = 1 if susp.get("base64", 0) > 2 else 0  # require multiple chunks

    features: Dict[str, float] = {
        "file_size_bytes": float(size_bytes),
        "entropy": float(entropy),
        "yara_match_count": float(yara_count),
        "suspicious_string_count": float(sum(susp.values())),
        "has_mz_header": float(has_mz_header),
        "has_macro_keywords": float(has_macro),
        "has_url": float(has_url),
        "has_base64_chunk": float(has_b64),
    }
    return features


def _features_to_array(features: Dict[str, float]) -> np.ndarray:
    """Convert feature dict into a 2D NumPy array in correct order."""
    return np.array([[features[name] for name in FEATURE_NAMES]], dtype=np.float64)

# -----------------------------
# Model loading and scoring
# -----------------------------

def initialize_model(model_path: Optional[os.PathLike] = None) -> None:
    """Load the serialized model (risk_model.pkl) into global memory."""
    global _MODEL
    with _MODEL_LOCK:
        path = Path(model_path) if model_path is not None else _MODEL_PATH
        if not path.exists():
            logger.warning("Risk model not found at %s. Train it with backend/train_model.py.", path)
            _MODEL = None
            return
        obj = joblib.load(path)
        if isinstance(obj, dict) and "model" in obj:
            _MODEL = obj["model"]
            saved_features = obj.get("feature_names")
            if saved_features and list(saved_features) != FEATURE_NAMES:
                logger.warning("Feature names differ from code; scores may be unreliable.")
        else:
            _MODEL = obj
        logger.info("Risk model loaded from %s", path)


def score_file(file_bytes: bytes, filename: str) -> int:
    """Extract features, run model prediction, return 0–100 risk score."""
    global _MODEL
    if _MODEL is None:
        initialize_model()
    if _MODEL is None:
        raise RuntimeError("Risk model not loaded. Run train_model.py first.")

    features = extract_features(file_bytes, filename)
    X = _features_to_array(features)

    # Try predict_proba first (preferred)
    proba: Optional[np.ndarray] = None
    try:
        proba = _MODEL.predict_proba(X)  # type: ignore
    except Exception:
        try:
            # Use decision_function and apply sigmoid as fallback
            decision = _MODEL.decision_function(X)  # type: ignore
            decision = np.atleast_1d(decision)
            score01 = float(1 / (1 + np.exp(-decision[0])))
            return int(round(score01 * 100))
        except Exception:
            # Last fallback: raw class prediction scaled
            pred = _MODEL.predict(X)  # type: ignore
            score01 = float(pred[0])
            return int(max(0, min(100, round(score01 * 100))))

    # If predict_proba succeeded
    if proba is not None:
        if proba.shape[1] == 2:
            risk_prob = float(proba[0, 1])  # class 1 = risky
        else:
            risk_prob = float(np.max(proba[0]))  # pick max prob if >2 classes
        return int(max(0, min(100, round(risk_prob * 100))))

    return 0  # Shouldn’t happen

# -----------------------------
# Utility
# -----------------------------

def compute_sha256(file_bytes: bytes) -> str:
    """Return SHA256 hash of file bytes (hex string)."""
    return hashlib.sha256(file_bytes).hexdigest()
