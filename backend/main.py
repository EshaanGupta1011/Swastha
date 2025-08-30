import asyncio
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from auth import router as auth_router
from routes.upload import router as upload_router
from routes.vitals import router as vitals_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")

PING_INTERVAL_SECONDS = 25 * 60
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

app = FastAPI(title="HealthTrack API", version="0.1.0")
_ping_task = None

async def ping_self():
    ping_url = f"{BACKEND_BASE_URL}/ping"
    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(ping_url)
                resp.raise_for_status()
                logger.info(f"Self-ping successful: {resp.status_code}")
            except httpx.HTTPStatusError as http_err:
                logger.error(f"Self-ping HTTP error {http_err.response.status_code}: {http_err}")
            except httpx.RequestError as req_err:
                logger.error(f"Self-ping network error: {req_err}")
            except Exception as e:
                logger.error(f"Unexpected error during self-ping: {e}")
            await asyncio.sleep(PING_INTERVAL_SECONDS)

@app.on_event("startup")
async def on_startup():
    global _ping_task
    _ping_task = asyncio.create_task(ping_self())
    logger.info("Backend started. Self-ping task scheduled.")

@app.on_event("shutdown")
async def on_shutdown():
    global _ping_task
    if _ping_task:
        _ping_task.cancel()
        try:
            await _ping_task
        except asyncio.CancelledError:
            pass
        logger.info("Self-ping task cancelled.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(vitals_router)

@app.get("/ping")
async def ping():
    return {"message": "pong", "status": "ok"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to HealthTrack API "}