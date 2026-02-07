from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import init_db
from app.routers import horses, medical


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Horse Index API",
    description="API for managing retired horses and their medical records",
    version="1.0.0",
    lifespan=lifespan,
)

origins = os.getenv(
    "BACKEND_CORS_ORIGINS", "http://localhost:8081,http://localhost:19006"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(horses.router, prefix="/api")
app.include_router(medical.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
