from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import bcrypt
from jose import jwt

from ..database import get_db
from ..models import User, Student
from ..schemas import Token, LoginRequest, StudentLoginRequest
from ..config import settings
from ..dependencies import get_current_user

router = APIRouter()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def parse_dob(dob_str: str) -> Optional[date]:
    dob_clean = dob_str.strip()
    # Try various formats: DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY
    formats = ["%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(dob_clean, fmt).date()
        except ValueError:
            continue
    return None

@router.post("/student/login", response_model=Token)
def student_login(request: StudentLoginRequest, db: Session = Depends(get_db)):
    usn = request.usn.strip().upper()
    parsed_dob = parse_dob(request.dob)
    
    if not parsed_dob:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Date of Birth format. Please use DD-MM-YYYY (e.g. 01-01-2004)."
        )

    student = db.query(Student).filter(func.upper(Student.usn) == usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Student not found with this USN."
        )

    if student.dob != parsed_dob:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Date of Birth for the provided USN."
        )

    # Ensure a User account exists for this student
    user = db.query(User).filter(User.username == usn).first()
    if not user:
        user = User(
            username=usn,
            hashed_password=bcrypt.hashpw(request.dob.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role="STUDENT"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        student.user_id = user.id
        db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": student.usn, "role": "STUDENT"},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "STUDENT",
        "username": student.usn,
        "student": {
            "id": student.id,
            "usn": student.usn,
            "name": student.name,
            "department": student.department,
            "year": student.year,
            "dob": student.dob.isoformat(),
            "needs_name": student.name is None or student.name.strip() == ""
        }
    }

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    username = request.username.strip()
    user = db.query(User).filter(User.username == username).first()
    
    # Also support student login via standard login form if USN + DOB entered
    if not user:
        # Check if username is a student USN
        student = db.query(Student).filter(func.upper(Student.usn) == username.upper()).first()
        if student:
            parsed_dob = parse_dob(request.password)
            if parsed_dob and student.dob == parsed_dob:
                access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
                access_token = create_access_token(
                    data={"sub": student.usn, "role": "STUDENT"},
                    expires_delta=access_token_expires
                )
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "role": "STUDENT",
                    "username": student.usn,
                    "student": {
                        "id": student.id,
                        "usn": student.usn,
                        "name": student.name,
                        "department": student.department,
                        "year": student.year,
                        "dob": student.dob.isoformat(),
                        "needs_name": student.name is None or student.name.strip() == ""
                    }
                }

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )

    student_data = None
    if user.role == "STUDENT":
        student = db.query(Student).filter(Student.usn == user.username).first()
        if student:
            student_data = {
                "id": student.id,
                "usn": student.usn,
                "name": student.name,
                "department": student.department,
                "year": student.year,
                "dob": student.dob.isoformat(),
                "needs_name": student.name is None or student.name.strip() == ""
            }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "student": student_data
    }

@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student_data = None
    if current_user.role == "STUDENT":
        student = db.query(Student).filter(Student.usn == current_user.username).first()
        if student:
            student_data = {
                "id": student.id,
                "usn": student.usn,
                "name": student.name,
                "department": student.department,
                "year": student.year,
                "dob": student.dob.isoformat(),
                "needs_name": student.name is None or student.name.strip() == ""
            }
            
    return {
        "username": current_user.username,
        "role": current_user.role,
        "student": student_data
    }
