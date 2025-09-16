import hashlib
import logging
import os
import threading
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np

logger = logging.getLogger(__name__)


# Feature schema must remain stable across training and inference
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


_MODEL: Optional[object] = None
_MODEL_LOCK = threading.Lock()
_MODEL_PATH = Path(__file__).with_name("risk_model.pkl")


def _safe_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    histogram = np.bincount(np.frombuffer(data, dtype=np.uint8), minlength=256).astype(np.float64)
    probs = histogram / histogram.sum()
    nonzero = probs[probs > 0]
    entropy = -np.sum(nonzero * np.log2(nonzero))
    return float(entropy)


def _scan_suspicious_strings(text: str) -> Dict[str, int]:
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
    try:
        import yara  # type: ignore

        rules_text = r"""
        rule SuspiciousMacro
        {
            strings:
                $a = /Auto(Open|Exec)|Document_Open|ThisDocument|WScript\.Shell/i
            condition:
                any of them
        }

        rule EncodedArtifacts
        {
            strings:
                $b64 = /[A-Za-z0-9+\/]{40,}={0,2}/
                $ps1 = /EncodedCommand|FromBase64String|Invoke-Mimikatz/i
            condition:
                #b64 > 2 or #ps1 > 0
        }
        """
        rules = yara.compile(source=rules_text)
        result = rules.match(data=data)
        return len(result)
    except Exception:
        # YARA optional; if not available or fails, return 0
        return 0


def extract_features(file_bytes: bytes, filename: str) -> Dict[str, float]:
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
    has_b64 = 1 if susp.get("base64", 0) > 2 else 0  # require at least a few chunks

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
    return np.array([[features[name] for name in FEATURE_NAMES]], dtype=np.float64)


def initialize_model(model_path: Optional[os.PathLike] = None) -> None:
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
                logger.warning("Feature names in model differ from current code. Proceeding but scores may be unreliable.")
        else:
            _MODEL = obj
        logger.info("Risk model loaded from %s", path)


def score_file(file_bytes: bytes, filename: str) -> int:
    global _MODEL
    if _MODEL is None:
        initialize_model()
    if _MODEL is None:
        raise RuntimeError("Risk model is not loaded. Please run backend/train_model.py to create risk_model.pkl.")

    features = extract_features(file_bytes, filename)
    X = _features_to_array(features)

    # Use predict_proba if available; otherwise, decision_function or raw prediction
    proba: Optional[np.ndarray] = None
    try:
        proba = _MODEL.predict_proba(X)  # type: ignore[attr-defined]
    except Exception:
        try:
            decision = _MODEL.decision_function(X)  # type: ignore[attr-defined]
            # Min-max to [0,1] for a single sample as a fallback
            decision = np.atleast_1d(decision)
            score01 = float(1 / (1 + np.exp(-decision[0])))
            return int(round(score01 * 100))
        except Exception:
            pred = _MODEL.predict(X)  # type: ignore[attr-defined]
            score01 = float(pred[0])
            return int(max(0, min(100, round(score01 * 100))))

    # Binary classification: assume class 1 is risky
    if proba is not None:
        if proba.shape[1] == 2:
            risk_prob = float(proba[0, 1])
        else:
            # If classes are not 2, take max non-zero class prob as risk
            risk_prob = float(np.max(proba[0]))
        return int(max(0, min(100, round(risk_prob * 100))))

    # Fallback (should not reach here)
    return 0


def compute_sha256(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


