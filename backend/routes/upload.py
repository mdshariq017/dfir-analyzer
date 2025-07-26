# backend/routes/upload.py

from fastapi import APIRouter, UploadFile, File
import os
from datetime import datetime
import hashlib

router = APIRouter()

UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(await file.read())

    file_hash = calculate_sha256(save_path)

    return {
        "message": f"{file.filename} uploaded successfully.",
        "saved_path": save_path,
        "sha256": file_hash
    }
