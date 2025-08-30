import os
import logging
from datetime import datetime, timedelta
from typing import Annotated

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer

from database import TokenData, Token, User, UserLogin, users_collection

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable not set!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES_STR = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
if not ACCESS_TOKEN_EXPIRE_MINUTES_STR:
    raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES environment variable not set!")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(ACCESS_TOKEN_EXPIRE_MINUTES_STR)
except ValueError:
    raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be an integer!")

router = APIRouter(prefix="/auth", tags=["auth"])

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(email: str):
    return users_collection.find_one({"email": email})

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user or not verify_password(password, user.get("password", "")):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    if not SECRET_KEY or not ALGORITHM:
        raise RuntimeError("SECRET_KEY or ALGORITHM not configured properly for JWT encoding.")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError as e:
        logger.error(f"JWT Error during decoding: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error processing token payload: {e}")
        raise credentials_exception
    user = get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register(user: User):
    logger.info(f"Registration attempt for email: {user.email}")
    if users_collection.find_one({"email": user.email}):
        logger.info(f"Registration failed: Email {user.email} already registered.")
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

    user_doc = {
        "email": user.email,
        "password": hashed_password,
        "full_name": user.full_name,
        "age": user.age,
        "gender": user.gender
    }

    try:
        result = users_collection.insert_one(user_doc)
        if result.inserted_id:
            logger.info(f"User {user.email} registered successfully with ID {result.inserted_id}.")
            return {"message": "User created successfully"}
        else:
            logger.error(f"Failed to get inserted_id for user {user.email}.")
            raise HTTPException(status_code=500, detail="Failed to create user in database")
    except Exception as e:
        logger.error(f"Database insertion error for user {user.email}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")

@router.post("/login", response_model=Token, summary="Login and get access token")
async def login(user_credentials: UserLogin):
    logger.info(f"Login attempt for email: {user_credentials.email}")
    authenticated_user = authenticate_user(user_credentials.email, user_credentials.password)
    if not authenticated_user:
        logger.info(f"Login failed: Invalid credentials for {user_credentials.email}.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user["email"]},
        expires_delta=access_token_expires
    )
    logger.info(f"Login successful for {user_credentials.email}. Token issued.")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/user/profile", summary="Get current user's profile")
async def get_user_profile(current_user: Annotated[dict, Depends(get_current_user)]):
    logger.info(f"Profile fetch requested for user: {current_user.get('email')}")
    try:
        user_email = current_user["email"]
        user_profile = users_collection.find_one(
            {"email": user_email},
            {"_id": 0, "password": 0}
        )

        if not user_profile:
            logger.warning(f"Profile not found for user: {user_email}")
            raise HTTPException(status_code=404, detail="User profile not found")

        logger.info(f"Profile fetched successfully for user: {user_email}")
        return user_profile

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching profile for {current_user.get('email', 'Unknown')}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching profile")