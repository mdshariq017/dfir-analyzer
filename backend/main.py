from dotenv import load_dotenv
try:
    from .routes.auth import router as auth_router, set_db as auth_set_db  # when run as package: uvicorn backend.main:app
except Exception:
    from routes.auth import router as auth_router, set_db as auth_set_db   # when run from inside backend/: uvicorn main:app
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
import os
import uuid
from pathlib import Path
import logging
import time
from typing import Dict, Any, Optional, Tuple, Iterable, Union
from collections import OrderedDict
from pymongo import MongoClient

# Load environment variables from .env (if present)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Try to import ml_pipeline and forensics modules.
# The fallback (except block) ensures this works whether run as a package or standalone script.
try:
    from .ml_pipeline import initialize_model, score_file, compute_sha256  # type: ignore
    from .forensics import analyze_raw_image  # type: ignore
except Exception:  # When executed as a script without package context
    from ml_pipeline import initialize_model, score_file, compute_sha256  # type: ignore
    from forensics import analyze_raw_image  # type: ignore

# Configure logger for error reporting and debugging
logger = logging.getLogger(__name__)

# ---------------------------
# App & CORS
# ---------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all origins (safe only in dev)
    allow_credentials=True,
    allow_methods=["*"],   # allow all HTTP methods
    allow_headers=["*"],   # allow all headers
)

# ---------------------------
# Upload dir
# ---------------------------
UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------
# MongoDB (pymongo) bootstrap
# ---------------------------
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://dfir_app:qazplmedc100@finance-tracker.wvcboup.mongodb.net/dfir?retryWrites=true&w=majority&appName=finance-tracker"
)
DB_NAME = os.getenv("DB_NAME", "dfir")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

# Plug DB into auth module and include routes
auth_set_db(db)
app.include_router(auth_router)

def _init_indexes():
    try:
        db.users.create_index("email", unique=True)
    except Exception:
        pass
    try:
        db.scans.create_index([("user_id", 1), ("created_at", -1)])
    except Exception:
        pass

def _user_id_from_request(req: Request) -> str:
    # Try to take the raw Bearer token value as a stable user key (simple & works with your frontend)
    auth = req.headers.get("Authorization", "")
    if auth.lower().startswith("bearer ") and len(auth.split(" ", 1)[1].strip()) > 0:
        return auth.split(" ", 1)[1].strip()
    return "anon"

def secure_filename(filename: str) -> str:
    """
    Generate a safe filename using a UUID, while keeping the original file extension.
    Prevents collisions and unsafe paths.
    """
    ext = Path(filename).suffix.lower()
    return f"{uuid.uuid4()}{ext}"

# ---------------------------
# In-memory LRU cache for analysis results (sha256 -> dict)
# ---------------------------
class LRUCache(OrderedDict):
    def __init__(self, capacity: int = 200):
        super().__init__()
        self.capacity = capacity

    def get(self, key: str) -> Optional[dict]:
        if key not in self:
            return None
        self.move_to_end(key)
        return super().get(key)

    def put(self, key: str, value: dict) -> None:
        self[key] = value
        self.move_to_end(key)
        if len(self) > self.capacity:
            self.popitem(last=False)

ANALYSIS_CACHE: LRUCache = LRUCache(capacity=200)

# ---------------------------
# CSV builder
# ---------------------------
def _flatten(prefix: str, obj: Any) -> Iterable[Tuple[str, str]]:
    """
    Flatten dict/list scalars into (key, value) pairs for CSV.
    - dict -> recurse with dotted keys
    - list of dicts -> index notation key[idx].field
    - simple list -> comma-joined string
    - scalars -> str()
    """
    # dict
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else str(k)
            yield from _flatten(new_key, v)
        return

    # list
    if isinstance(obj, list):
        if all(isinstance(x, dict) for x in obj):
            for i, item in enumerate(obj):
                new_key = f"{prefix}[{i}]"
                for k, v in item.items():
                    yield from _flatten(f"{new_key}.{k}", v)
        else:
            # simple list -> comma-joined
            yield (prefix, ", ".join(str(x) for x in obj))
        return

    # scalar
    yield (prefix, "" if obj is None else str(obj))

def _dict_to_csv(data: Dict[str, Any]) -> str:
    """
    Render a generic dict to a simple two-column CSV:
    field,value
    top_files[0].name, /foo/bar
    ...
    """
    import csv
    import io

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["field", "value"])
    for k, v in _flatten("", data):
        writer.writerow([k, v])
    return buf.getvalue()

# ---------------------------
# Startup: load model once
# ---------------------------
@app.on_event("startup")
def load_model_on_startup() -> None:
    try:
        initialize_model()
        _init_indexes()
    except Exception as exc:
        logger.exception("Failed to load risk model on startup: %s", exc)

# ---------------------------
# Analyze endpoint (unchanged behavior, but now caches result)
# ---------------------------
@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...), request: Request = None):
    """
    Main API endpoint for file analysis.
    - Accepts uploaded file
    - If RAW image (.raw/.dd/.img) → run forensic analysis
    - Else → run ML risk scoring
    Returns JSON results including filename, score/summary, and SHA256 hash.
    """
    contents = await file.read()

    # Reject empty uploads
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Reject very large files (>50MB) to protect server resources
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    ext = Path(file.filename).suffix.lower()

    # RAW image path
    if ext in {".raw", ".dd", ".img"}:
        try:
            result = analyze_raw_image(contents)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.exception("RAW image analysis failed: %s", e)
            raise HTTPException(status_code=500, detail="RAW image analysis failed")

        # Compute overall image sha256 so we can cache/export by hash
        img_sha256 = compute_sha256(contents)

        # Build structured summary response for RAW images
        result_out = {
            "filename": file.filename,
            "sha256": img_sha256,
            "num_files": result.get("num_files", 0),
            "top_files": result.get("top_files", []),
            "suspicious": result.get("suspicious", []),
            "hashes": result.get("hashes", []),
            # accept 'timeline' if present from forensics.py (backward-safe)
            "timeline": result.get("timeline", []),
        }

        # persist a scan document
        try:
            db.scans.insert_one({
                "user_id": _user_id_from_request(request),
                "type": "raw",
                "filename": file.filename,
                "sha256": img_sha256,
                "summary": result_out,
                "created_at": time.time(),
            })
        except Exception:
            logger.exception("Failed to save RAW scan")

        # Cache it by sha256
        ANALYSIS_CACHE.put(img_sha256, result_out)
        return result_out

    # Non-RAW: ML risk scoring
    try:
        risk_score = score_file(contents, file.filename)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

    sha256 = compute_sha256(contents)
    result_out = {
        "filename": file.filename,
        "risk_score": risk_score,   # 0–100 score from model
        "sha256": sha256,           # unique hash of uploaded file
    }

    # persist a scan document
    try:
        db.scans.insert_one({
            "user_id": _user_id_from_request(request),
            "type": "file",
            "filename": file.filename,
            "sha256": sha256,
            "score": risk_score,
            "created_at": time.time(),
        })
    except Exception:
        logger.exception("Failed to save scan")

    # Basic stub structure so exports are uniform keys-wise
    ANALYSIS_CACHE.put(sha256, result_out)
    return result_out

# ---------------------------
# Export endpoints
# ---------------------------
@app.get("/export/json")
def export_json(sha256: str):
    """
    Return cached JSON analysis for a given sha256.
    """
    data = ANALYSIS_CACHE.get(sha256)
    if not data:
        raise HTTPException(status_code=404, detail="No cached analysis for given sha256")
    return JSONResponse(content=data)

@app.get("/export/csv")
def export_csv(sha256: str):
    """
    Return a CSV (two-column: field,value) rendering of the cached analysis.
    """
    data = ANALYSIS_CACHE.get(sha256)
    if not data:
        raise HTTPException(status_code=404, detail="No cached analysis for given sha256")

    try:
        csv_text = _dict_to_csv(data)
    except Exception as exc:
        logger.exception("CSV rendering failed: %s", exc)
        raise HTTPException(status_code=500, detail="CSV rendering failed")

    # Suggest a filename in the headers
    filename = f"{sha256}.csv"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return Response(content=csv_text, media_type="text/csv", headers=headers)

# ---------------------------
# History & Stats
# ---------------------------

@app.get("/history")
def history(limit: int = 50, request: Request = None):
    uid = _user_id_from_request(request)
    cur = db.scans.find({"user_id": uid}).sort("created_at", -1).limit(limit)
    out = []
    for d in cur:
        d["_id"] = str(d["_id"])
        out.append(d)
    return out

@app.get("/stats")
def stats(request: Request = None, high_threshold: int = 70):
    uid = _user_id_from_request(request)

    total = db.scans.count_documents({"user_id": uid})

    # average risk over non-RAW with a score
    pipeline_avg = [
        {"$match": {"user_id": uid, "type": "file", "score": {"$ne": None}}},
        {"$group": {"_id": None, "avg": {"$avg": "$score"}}}
    ]
    docs = list(db.scans.aggregate(pipeline_avg))
    avg_risk = round(docs[0]["avg"], 1) if docs else 0.0

    high_risk = db.scans.count_documents({"user_id": uid, "type": "file", "score": {"$gte": high_threshold}})

    # File-type breakdown via filename extension
    pipeline_types = [
        {"$match": {"user_id": uid}},
        {"$project": {
            "ext": {
                "$toLower": {
                    "$let": {
                        "vars": {"arr": {"$split": ["$filename", "."]}},
                        "in": {
                            "$concat": [".", {"$arrayElemAt": ["$$arr", {"$subtract": [{"$size": "$$arr"}, 1]}]}]
                        }
                    }
                }
            }
        }},
        {"$group": {"_id": "$ext", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    types = [{"ext": d["_id"] or "other", "count": d["count"]} for d in db.scans.aggregate(pipeline_types)]

    # simple series = just the last N timestamps
    pipeline_series = [
        {"$match": {"user_id": uid}},
        {"$sort": {"created_at": 1}},
        {"$project": {"t": "$created_at"}}
    ]
    times = [d["t"] for d in db.scans.aggregate(pipeline_series)]

    return {
        "total_scans": total,
        "avg_risk": avg_risk,
        "high_risk": high_risk,
        "types": types,
        "times": times[-10:],
        "high_threshold": high_threshold
    }
