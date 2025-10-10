from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt_sha256 as hasher
import os, time, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

# Injected from main.py
_db = None
def set_db(db):  # called by main.py
    global _db
    _db = db

# Read from environment (compatible with your .env)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
_ACCESS_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "20160"))  # default 14 days
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", str(_ACCESS_MIN * 60)))

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

def _issue_token(sub: str, name: str) -> str:
    now = int(time.time())
    payload = {"sub": sub, "name": name, "iat": now, "exp": now + JWT_TTL_SECONDS}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    return token if isinstance(token, str) else token.decode("utf-8")

@router.post("/register")
def register(body: RegisterIn):
    assert _db is not None, "DB not initialized"
    users = _db.users
    if users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    pw_hash = hasher.hash(body.password)
    doc = {
        "email": body.email.lower(),
        "name": (body.name or "").strip() or body.email.split("@")[0],
        "password_hash": pw_hash,
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    users.insert_one(doc)
    return {"access_token": _issue_token(doc["email"], doc["name"]), "name": doc["name"]}

@router.post("/login")
def login(body: LoginIn):
    assert _db is not None, "DB not initialized"
    users = _db.users
    user = users.find_one({"email": body.email.lower()})
    if not user or not hasher.verify(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    name = user.get("name") or "User"
    return {"access_token": _issue_token(user["email"], name), "name": name}

@router.get("/me")
def me(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.split(" ", 1)[1].strip()
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return {"email": data.get("sub"), "name": data.get("name")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
