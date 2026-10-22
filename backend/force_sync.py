import asyncio
from app.database import SessionLocal
from app.models import StudentPlatform
from app.sync import async_sync_student_leetcode

async def main():
    db = SessionLocal()
    platforms = db.query(StudentPlatform).all()
    for p in platforms:
        print(f"Syncing {p.username}...")
        await async_sync_student_leetcode(db, p, force=True)
    db.close()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
