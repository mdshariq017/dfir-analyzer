from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import logging

# Try to import ml_pipeline and forensics modules.
# The fallback (except block) ensures this works whether run as a package or standalone script.
try:
    from .ml_pipeline import initialize_model, score_file, compute_sha256  # type: ignore
    from .forensics import analyze_raw_image  
except Exception:  # When executed as a script without package context
    from ml_pipeline import initialize_model, score_file, compute_sha256  # type: ignore
    from forensics import analyze_raw_image  

# Configure logger for error reporting and debugging
logger = logging.getLogger(__name__)

# Create the FastAPI application
app = FastAPI()

# Enable CORS so frontend (React/JS) can communicate with backend
# In production, this should be restricted to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all origins (safe only in dev)
    allow_credentials=True,
    allow_methods=["*"],   # allow all HTTP methods
    allow_headers=["*"],   # allow all headers
)

# Directory where uploaded files could be stored (ensures folder exists)
UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def secure_filename(filename: str) -> str:
    """
    Generate a safe filename using a UUID, while keeping the original file extension.
    Prevents collisions and unsafe paths.
    """
    ext = Path(filename).suffix.lower()
    return f"{uuid.uuid4()}{ext}"


@app.on_event("startup")
def load_model_on_startup() -> None:
    """
    Run automatically when the server starts.
    Loads the ML risk model into memory so that scoring is ready.
    """
    try:
        initialize_model()
    except Exception as exc:
        logger.exception("Failed to load risk model on startup: %s", exc)


@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """
    Main API endpoint for file analysis.
    - Accepts uploaded file
    - If RAW image (.raw/.dd/.img) → run forensic analysis
    - Else → run ML risk scoring
    Returns JSON results including filename, score/summary, and SHA256 hash.
    """
    # Read full file contents
    contents = await file.read()

    # Reject empty uploads
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Reject very large files (>50MB) to protect server resources
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    # Detect if the file is a RAW disk image
    ext = Path(file.filename).suffix.lower()
    if ext in {".raw", ".dd", ".img"}:
        try:
            # Analyze using forensic pipeline (pytsk3)
            result = analyze_raw_image(contents)
        except ValueError as e:
            # User-level error (e.g., empty image)
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            # Unexpected internal error in forensic analysis
            logger.exception("RAW image analysis failed: %s", e)
            raise HTTPException(status_code=500, detail="RAW image analysis failed")

        # Build structured summary response for RAW images
        result_out = {
            "filename": file.filename,
            "num_files": result.get("num_files", 0),
            "top_files": result.get("top_files", []),
            "suspicious": result.get("suspicious", []),
            "hashes": result.get("hashes", []),
        }
        return result_out

    # If not RAW, run ML risk scoring
    try:
        risk_score = score_file(contents, file.filename)
    except RuntimeError as e:
        # Model not loaded or unavailable
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        # Unexpected ML pipeline error
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

    # Always compute SHA-256 for integrity verification
    sha256 = compute_sha256(contents)

    # Build response for non-RAW files
    return {
        "filename": file.filename,
        "risk_score": risk_score,   # 0–100 score from model
        "sha256": sha256,           # unique hash of uploaded file
    }
