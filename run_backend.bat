@echo off
echo Starting PostgreSQL...
call "%~dp0backend\start_postgres.bat"
timeout /t 2 /nobreak >nul
echo Starting FastAPI Backend on http://localhost:8000...
cd "%~dp0backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

