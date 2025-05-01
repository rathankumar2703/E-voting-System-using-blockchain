from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from typing import Optional
import hashlib
import logging
import os
from pathlib import Path
import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "123456",  # Replace with your MySQL root password
    "database": "voting_db"
}

SYMBOLS_DIR = Path("symbols")
USER_IMAGES_DIR = Path("user_images")
SYMBOLS_DIR.mkdir(exist_ok=True)
USER_IMAGES_DIR.mkdir(exist_ok=True)

SECRET_KEY = "d2b861a623b1d0e89f7c91c313bce1db34fbce8356ca80cf38b72e4c5a832ed5f0fa7136ef0ed5c32641308daa88c29c108d85835afcf37e5385c8e2c4cacee6"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    voter_id: str
    password: str
    name: str
    dob: str
    aadhaar: str
    gender: str
    phone: str
    email: str
    image_hash: Optional[str] = None

class Candidate(BaseModel):
    name: str
    party: str

def get_db():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info(f"Token payload: {payload}")
        return payload
    except jwt.PyJWTError as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            voter_id VARCHAR(50) PRIMARY KEY,
            password VARCHAR(255),
            name VARCHAR(100),
            dob DATE,
            aadhaar VARCHAR(12) UNIQUE,
            gender VARCHAR(10),
            phone VARCHAR(10),
            email VARCHAR(100),
            image_hash VARCHAR(64)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id INT PRIMARY KEY,
            name VARCHAR(100),
            party VARCHAR(100),
            symbol_hash VARCHAR(64),
            votes INT DEFAULT 0
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()
    logger.info("Database initialized successfully")

init_db()

@app.post("/register")
async def register(
    voter_id: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    dob: str = Form(...),
    aadhaar: str = Form(...),
    gender: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    image: UploadFile = File(...),
):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT aadhaar FROM users WHERE aadhaar = %s", (aadhaar,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Aadhaar already registered")
        
        image_content = await image.read()
        image_hash = hashlib.sha256(image_content).hexdigest()
        image_path = USER_IMAGES_DIR / f"{image_hash}.png"
        with image_path.open("wb") as f:
            f.write(image_content)
        
        cursor.execute("""
            INSERT INTO users (voter_id, password, name, dob, aadhaar, gender, phone, email, image_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (voter_id, password, name, dob, aadhaar, gender, phone, email, image_hash))
        conn.commit()
        logger.info(f"User registered: {voter_id}")
        return {"message": "User registered successfully"}
    except Exception as e:
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/login")
async def login(voter_id: str = Form(...), password: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT voter_id, password, aadhaar FROM users WHERE voter_id = %s AND password = %s", (voter_id, password))
        user = cursor.fetchone()
        if not user:
            logger.error(f"Login failed for {voter_id}: Invalid credentials")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = jwt.encode({
            "voter_id": voter_id,
            "aadhaar": user[2],
            "role": "admin" if voter_id == "admin" else "voter",
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"Login successful for {voter_id}, token generated")
        return {"token": token}
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/add_candidate")
async def add_candidate(
    name: str = Form(...),
    party: str = Form(...),
    symbol: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    if token["role"] != "admin":
        logger.error(f"Unauthorized attempt to add candidate by {token['voter_id']}")
        raise HTTPException(status_code=403, detail="Admin access required")
    
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COALESCE(MAX(id), -1) FROM candidates")
        max_id = cursor.fetchone()[0]
        candidate_id = max_id + 1
        
        symbol_content = await symbol.read()
        symbol_hash = hashlib.sha256(symbol_content).hexdigest()
        symbol_path = SYMBOLS_DIR / f"{candidate_id}.png"
        with symbol_path.open("wb") as f:
            f.write(symbol_content)
        
        cursor.execute("""
            INSERT INTO candidates (id, name, party, symbol_hash)
            VALUES (%s, %s, %s, %s)
        """, (candidate_id, name, party, symbol_hash))
        conn.commit()
        logger.info(f"Candidate added: {name} (ID: {candidate_id})")
        return {"message": "Candidate added", "candidate_id": candidate_id}
    except Exception as e:
        logger.error(f"Add candidate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/user/{voter_id}")
async def get_user(voter_id: str, token: str = Depends(verify_token)):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT voter_id, name, dob, aadhaar, gender, phone, email, image_hash FROM users WHERE voter_id = %s", (voter_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "voter_id": user[0], "name": user[1], "dob": user[2], "aadhaar": user[3],
            "gender": user[4], "phone": user[5], "email": user[6], "image_hash": user[7]
        }
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()