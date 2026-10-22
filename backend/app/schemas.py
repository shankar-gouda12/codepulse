from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    student: Optional[dict] = None
    username: Optional[str] = None

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None

class LoginRequest(BaseModel):
    username: str
    password: str

class StudentLoginRequest(BaseModel):
    usn: str
    dob: str # Format DD-MM-YYYY or YYYY-MM-DD

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    profile_photo: Optional[str] = None

class StudentResponse(BaseModel):
    id: int
    usn: str
    name: Optional[str] = None
    dob: date
    department: str
    year: int
    profile_photo: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True

class RecentProblem(BaseModel):
    title: str
    external_id: str
    url: Optional[str] = None
    solved_date: Optional[datetime] = None

class LeetCodeStatsResponse(BaseModel):
    connected: bool
    username: Optional[str] = None
    profile_url: Optional[str] = None
    avatar_url: Optional[str] = None
    ranking: Optional[int] = None
    verified: bool = False
    last_synced_at: Optional[datetime] = None
    sync_status: Optional[str] = None
    sync_error: Optional[str] = None
    total_problems: Optional[int] = None
    easy: Optional[int] = None
    medium: Optional[int] = None
    hard: Optional[int] = None
    active_days: Optional[int] = None
    current_streak: Optional[int] = None
    longest_streak: Optional[int] = None
    last_active: Optional[datetime] = None
    submission_calendar: Optional[str] = None
    recent_problems: Optional[List[RecentProblem]] = None
