import asyncio
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models import Department, Student, User
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def init_db():
    print("Dropping existing tables to avoid schema mismatches...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS sync_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS daily_activity CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS student_problems CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS student_platforms CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS problems CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS students CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS departments CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.commit()
    
    print("Creating tables with updated schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create department
        print("Creating department MCA...")
        mca = Department(name="MCA")
        db.add(mca)
        db.commit()
        db.refresh(mca)
        
        # Create Placement Head
        print("Creating Placement Head (placement_head / placement123)...")
        ph_user = User(
            username="placement_head",
            hashed_password=hash_password("placement123"),
            role="PLACEMENT_HEAD"
        )
        db.add(ph_user)
        db.commit()

        # Create 100 students: 1DT25MC001 to 1DT25MC100
        print("Creating 100 MCA students (1DT25MC001 - 1DT25MC100, DOB: 01-01-2004)...")
        dob = datetime.date(2004, 1, 1)
        student_pwd_hash = hash_password("01-01-2004")
        
        for i in range(1, 101):
            usn = f"1DT25MC{i:03d}"
            student_user = User(
                username=usn,
                hashed_password=student_pwd_hash,
                role="STUDENT"
            )
            db.add(student_user)
            db.flush() # get user id
            
            new_student = Student(
                usn=usn,
                name=None, # Requirement: Students enter their names after their first login
                dob=dob,
                department="MCA",
                year=1,
                user_id=student_user.id
            )
            db.add(new_student)
        
        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
