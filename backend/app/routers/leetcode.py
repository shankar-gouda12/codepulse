from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, Dict, Any

from ..database import get_db
from ..models import Student, StudentPlatform, SyncLog, StudentProblem, DailyActivity, Problem
from ..dependencies import get_current_student
from ..sync import fetch_leetcode_profile, async_sync_student_leetcode

router = APIRouter()

class ConnectRequest(BaseModel):
    username: str

def format_platform_stats(platform: Optional[StudentPlatform], db: Session) -> Dict[str, Any]:
    if not platform or not platform.username:
        return {"connected": False}

    recent_problems_query = db.query(StudentProblem, Problem).join(
        Problem, StudentProblem.problem_id == Problem.id
    ).filter(
        StudentProblem.student_id == platform.student_id
    ).order_by(desc(StudentProblem.solved_date), desc(StudentProblem.id)).limit(15).all()

    recent_problems = [
        {
            "title": prob.title,
            "external_id": prob.external_id,
            "url": prob.url,
            "solved_date": sp.solved_date
        }
        for sp, prob in recent_problems_query
    ]

    return {
        "connected": True,
        "username": platform.username,
        "profile_url": platform.profile_url,
        "avatar_url": platform.avatar_url,
        "ranking": platform.ranking,
        "verified": platform.verified,
        "last_synced_at": platform.last_synced_at,
        "sync_status": platform.sync_status,
        "sync_error": platform.sync_error,
        "total_problems": platform.total_problems,
        "easy": platform.easy,
        "medium": platform.medium,
        "hard": platform.hard,
        "active_days": platform.active_days,
        "current_streak": platform.current_streak,
        "longest_streak": platform.longest_streak,
        "last_active": platform.last_active,
        "submission_calendar": platform.submission_calendar,
        "recent_problems": recent_problems
    }

@router.post("/connect")
async def connect_leetcode(
    request: ConnectRequest,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    clean_username = request.username.strip()
    if not clean_username:
        raise HTTPException(status_code=400, detail="LeetCode username cannot be empty")

    # 1. Fetch profile in real time via warm connection
    data = await fetch_leetcode_profile(clean_username)
    if not data or "errors" in data or not data.get("data", {}).get("matchedUser"):
        raise HTTPException(
            status_code=400,
            detail=f"LeetCode profile '{clean_username}' was not found. Please verify the exact username on leetcode.com."
        )

    # 2. Check or create platform record
    platform = db.query(StudentPlatform).filter(
        StudentPlatform.student_id == current_student.id,
        StudentPlatform.platform == "LEETCODE"
    ).first()

    if platform:
        platform.username = clean_username
        platform.verified = True
    else:
        platform = StudentPlatform(
            student_id=current_student.id,
            platform="LEETCODE",
            username=clean_username,
            verified=True
        )
        db.add(platform)

    db.commit()
    db.refresh(platform)

    # 3. Synchronize stats using the already fetched data (zero duplicate network calls!)
    await async_sync_student_leetcode(db, platform, force=True, preloaded_data=data)
    db.refresh(platform)

    stats = format_platform_stats(platform, db)

    return {
        "message": "LeetCode profile connected and synchronized in real time!",
        "username": platform.username,
        "total_problems": platform.total_problems,
        "stats": stats
    }

@router.post("/sync")
async def sync_now(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    platform = db.query(StudentPlatform).filter(
        StudentPlatform.student_id == current_student.id,
        StudentPlatform.platform == "LEETCODE"
    ).first()

    if not platform or not platform.username:
        raise HTTPException(status_code=400, detail="LeetCode is not connected. Please connect your profile first.")

    # Execute high-speed real-time sync
    await async_sync_student_leetcode(db, platform, force=True)
    db.refresh(platform)

    stats = format_platform_stats(platform, db)

    return {
        "message": "LeetCode synchronization completed in real time!",
        "stats": stats
    }

@router.delete("/disconnect")
async def disconnect_leetcode(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    platform = db.query(StudentPlatform).filter(
        StudentPlatform.student_id == current_student.id,
        StudentPlatform.platform == "LEETCODE"
    ).first()

    if not platform:
        raise HTTPException(status_code=400, detail="No LeetCode profile is connected")

    try:
        # Delete associated records
        db.query(SyncLog).filter(SyncLog.student_platform_id == platform.id).delete(synchronize_session=False)
        db.query(StudentProblem).filter(StudentProblem.student_id == current_student.id).delete(synchronize_session=False)
        db.query(DailyActivity).filter(DailyActivity.student_id == current_student.id).delete(synchronize_session=False)
        db.delete(platform)
        db.commit()
        return {"message": "LeetCode profile disconnected successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to disconnect profile: {str(e)}")
