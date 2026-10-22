from app.database import SessionLocal
from app.models import Student
db = SessionLocal()
count = db.query(Student).count()
print(f"Students count: {count}")
