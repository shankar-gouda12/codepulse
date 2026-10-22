from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .config import settings
from .routers import auth, students, placement, leetcode

# Create tables if not exists
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from .sync import sync_all_leetcode_profiles

# Setup Background Scheduler for LeetCode Sync
scheduler = BackgroundScheduler()
scheduler.add_job(sync_all_leetcode_profiles, 'interval', minutes=settings.LEETCODE_SYNC_INTERVAL_MINUTES)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background worker on startup
    scheduler.start()
    yield
    # Shutdown gracefully
    scheduler.shutdown()

app = FastAPI(
    title="DSATM CodePulse API",
    description="Backend API for College Coding Activity & Placement Analytics Platform",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(placement.router, prefix="/api/placement", tags=["placement"])
app.include_router(leetcode.router, prefix="/api/leetcode", tags=["leetcode"])

@app.get("/")
def read_root():
    return {"message": "Welcome to DSATM CodePulse API"}
