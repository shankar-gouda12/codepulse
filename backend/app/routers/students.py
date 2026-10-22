from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Student, User, StudentPlatform, StudentProblem, Problem
from ..schemas import StudentUpdate, StudentResponse, LeetCodeStatsResponse
from ..dependencies import get_current_student
from ..sync import async_sync_student_leetcode

router = APIRouter()

@router.get("/me", response_model=StudentResponse)
def get_my_profile(current_student: Student = Depends(get_current_student)):
    return current_student

@router.put("/me", response_model=StudentResponse)
def update_my_profile(
    update_data: StudentUpdate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Rule 2: Students enter their names after their first login. USN, DOB, department, and year cannot be edited.
    # Allow students to update or completely remove their name
    fields_set = getattr(update_data, "model_fields_set", getattr(update_data, "__fields_set__", set()))
    if "name" in fields_set:
        if update_data.name is None or not str(update_data.name).strip():
            current_student.name = None
        else:
            current_student.name = str(update_data.name).strip()
    elif update_data.name is not None:
        clean_name = str(update_data.name).strip()
        current_student.name = clean_name if clean_name else None

    if "profile_photo" in fields_set:
        clean_photo = update_data.profile_photo.strip() if update_data.profile_photo else None
        current_student.profile_photo = clean_photo

    db.commit()
    db.refresh(current_student)
    return current_student

@router.get("/me/leetcode", response_model=LeetCodeStatsResponse)
async def get_my_leetcode(
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    platform = db.query(StudentPlatform).filter(
        StudentPlatform.student_id == current_student.id,
        StudentPlatform.platform == "LEETCODE"
    ).first()

    if not platform:
        return LeetCodeStatsResponse(connected=False)

    # Allow periodic dashboard polling to pick up newly accepted problems quickly.
    if platform.username and (platform.last_synced_at is None or (datetime.utcnow() - platform.last_synced_at) > timedelta(seconds=5)):
        try:
            await async_sync_student_leetcode(db, platform, force=True)
            db.refresh(platform)
        except Exception as e:
            print(f"Auto real-time sync error: {e}")

    recent_problems_query = db.query(StudentProblem, Problem).join(
        Problem, StudentProblem.problem_id == Problem.id
    ).filter(
        StudentProblem.student_id == current_student.id
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

    return LeetCodeStatsResponse(
        connected=True,
        username=platform.username,
        profile_url=platform.profile_url,
        avatar_url=platform.avatar_url,
        ranking=platform.ranking,
        verified=platform.verified,
        last_synced_at=platform.last_synced_at,
        sync_status=platform.sync_status,
        sync_error=platform.sync_error,
        total_problems=platform.total_problems,
        easy=platform.easy,
        medium=platform.medium,
        hard=platform.hard,
        active_days=platform.active_days,
        current_streak=platform.current_streak,
        longest_streak=platform.longest_streak,
        last_active=platform.last_active,
        submission_calendar=platform.submission_calendar,
        recent_problems=recent_problems
    )
