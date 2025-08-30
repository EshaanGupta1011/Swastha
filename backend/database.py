from pymongo import MongoClient
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import certifi

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where()
)

db = client.healthtrack

users_collection = db["users"]
reports_collection = db["reports"]

class ReportCategory(str, Enum):
    NEUROLOGIST = "Neurologist"
    UROLOGIST = "Urologist"
    PSYCHOLOGIST = "Psychologist"
    GENERAL = "General"
    DENTIST = "Dentist"
    CARDIOLOGIST = "Cardiologist"
    OTHER = "Other"

class User(BaseModel):
    email: str
    password: str
    full_name: str
    age: int = Field(..., gt=0, le=120)
    gender: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ReportData(BaseModel):
    user_id: str
    filename: str
    extracted_data: Dict[str, Any]
    upload_date: datetime
    file_size: Optional[int] = None
    category: ReportCategory = ReportCategory.GENERAL