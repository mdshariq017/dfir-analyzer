from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import logging

try:
    from .ml_pipeline import initialize_model, score_file, compute_sha256  # type: ignore
    from .forensics import analyze_raw_image  # type: ignore
except Exception:  # When executed as a script without package context
    from ml_pipeline import initialize_model, score_file, compute_sha256  # type: ignore
    from forensics import analyze_raw_image  # type: ignore


logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend dev purposes only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def secure_filename(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return f"{uuid.uuid4()}{ext}"


@app.on_event("startup")
def load_model_on_startup() -> None:
    try:
        initialize_model()
    except Exception as exc:
        logger.exception("Failed to load risk model on startup: %s", exc)


@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # 50MB limit to support larger forensic artifacts, adjustable as needed
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    ext = Path(file.filename).suffix.lower()
    if ext in {".raw", ".dd", ".img"}:
        try:
            result = analyze_raw_image(contents)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.exception("RAW image analysis failed: %s", e)
            raise HTTPException(status_code=500, detail="RAW image analysis failed")

        result_out = {
            "filename": file.filename,
            "num_files": result.get("num_files", 0),
            "top_files": result.get("top_files", []),
            "suspicious": result.get("suspicious", []),
            "hashes": result.get("hashes", []),
        }
        return result_out

    try:
        risk_score = score_file(contents, file.filename)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

    sha256 = compute_sha256(contents)

    return {
        "filename": file.filename,
        "risk_score": risk_score,
        "sha256": sha256,
    }
