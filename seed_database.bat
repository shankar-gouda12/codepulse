@echo off
echo Seeding PostgreSQL database with 100 MCA students and placement officer...
cd "%~dp0backend"
.\.venv\Scripts\python.exe seed_db.py
pause

