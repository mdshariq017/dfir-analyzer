from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import random

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

def calculate_risk_score(filename: str, content: bytes) -> int:
    # Replace with actual AI/ML logic later
    if filename.endswith((".exe", ".bat", ".vbs")):
        return random.randint(80, 100)
    elif filename.endswith((".pdf", ".docx", ".xlsx")):
        return random.randint(40, 70)
    else:
        return random.randint(10, 50)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    # 10MB file size limit
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    safe_filename = secure_filename(file.filename)
    file_location = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_location, "wb") as f:
        f.write(contents)

    score = calculate_risk_score(safe_filename, contents)

    return {
        "original_filename": file.filename,
        "stored_as": safe_filename,
        "score": score,
        "message": "Upload successful"
    }
