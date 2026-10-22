from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # For placement head
    hashed_password = Column(String)
    role = Column(String, default="STUDENT") # STUDENT, PLACEMENT_HEAD
    created_at = Column(DateTime, server_default=func.now())
    
class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    students = relationship("Student", back_populates="department_rel")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    usn = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    dob = Column(Date)
    department = Column(String, ForeignKey("departments.name"))
    year = Column(Integer)
    profile_photo = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional link to user if needed
    
    department_rel = relationship("Department", back_populates="students")
    platforms = relationship("StudentPlatform", back_populates="student")
    problems = relationship("StudentProblem", back_populates="student")
    daily_activities = relationship("DailyActivity", back_populates="student")

class StudentPlatform(Base):
    __tablename__ = "student_platforms"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    platform = Column(String) # LEETCODE
    username = Column(String)
    profile_url = Column(String)
    avatar_url = Column(String, nullable=True)
    ranking = Column(Integer, nullable=True)
    verified = Column(Boolean, default=False)
    connected_at = Column(DateTime, server_default=func.now())
    last_synced_at = Column(DateTime, nullable=True)
    sync_status = Column(String, nullable=True) # SUCCESS, ERROR
    sync_error = Column(String, nullable=True)
    
    # Stats caching
    total_problems = Column(Integer, default=0)
    easy = Column(Integer, default=0)
    medium = Column(Integer, default=0)
    hard = Column(Integer, default=0)
    active_days = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active = Column(DateTime, nullable=True)
    submission_calendar = Column(Text, nullable=True)
    
    student = relationship("Student", back_populates="platforms")
    sync_logs = relationship("SyncLog", back_populates="platform", cascade="all, delete-orphan")

class Problem(Base):
    __tablename__ = "problems"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True) # LeetCode problem ID or titleSlug
    title = Column(String)
    difficulty = Column(String)
    url = Column(String)

class StudentProblem(Base):
    __tablename__ = "student_problems"
    __table_args__ = (UniqueConstraint('student_id', 'problem_id', name='uq_student_problem'),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    problem_id = Column(Integer, ForeignKey("problems.id"))
    solved_date = Column(DateTime, nullable=True)
    language = Column(String, nullable=True)
    
    student = relationship("Student", back_populates="problems")
    problem = relationship("Problem")

class DailyActivity(Base):
    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint('student_id', 'activity_date', name='uq_student_activity_date'),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    activity_date = Column(Date)
    submissions = Column(Integer, default=0)
    problems_solved = Column(Integer, default=0)
    
    student = relationship("Student", back_populates="daily_activities")

class SyncLog(Base):
    __tablename__ = "sync_logs"
    id = Column(Integer, primary_key=True, index=True)
    student_platform_id = Column(Integer, ForeignKey("student_platforms.id", ondelete="CASCADE"))
    sync_time = Column(DateTime, server_default=func.now())
    status = Column(String)
    message = Column(String, nullable=True)

    platform = relationship("StudentPlatform", back_populates="sync_logs")
