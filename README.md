# DSATM CodePulse

**DSATM CodePulse** is a specialized college coding activity and placement analytics platform for **Dayananda Sagar Academy of Technology and Management (DSATM)**, specifically tailored for the Department of Master of Computer Applications (MCA).

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 16 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend:** FastAPI, Python 3.13, SQLAlchemy 2, APScheduler, Pydantic, HTTPX
- **Database:** Local native PostgreSQL 16 (No Docker, Redis, or Celery)
- **Reporting:** Pandas, OpenPyXL (Excel), ReportLab (PDF)

---

## 🚀 Quick Start (Windows)

### 1. Start Backend & PostgreSQL
Double-click `run_backend.bat` or run:
```powershell
# From root directory:
.\run_backend.bat
```
This automatically starts the local PostgreSQL server and runs the FastAPI API at `http://localhost:8000`.

### 2. Start Frontend
Double-click `run_frontend.bat` or run:
```powershell
# From root directory:
.\run_frontend.bat
```
Open `http://localhost:3000` in your web browser.

---

## 🔑 Login Credentials

### 1. Student Portal
- **USN:** `1DT25MC001` through `1DT25MC100` (100 MCA students seeded)
- **Date of Birth:** `01-01-2004` (Format: `DD-MM-YYYY`)
- *Note:* On first login, students are prompted to enter their official Full Name. USN, DOB, Department (`MCA`), and Year (`1`) cannot be edited.

### 2. Placement Head Portal
- **Login ID:** `placement_head`
- **Password:** `placement123`

---

## ✨ Features Implemented

1. **Student Login & First-Time Profile Setup:**
   - Validates USN and Date of Birth.
   - Enforces immutability of USN, DOB, department, and academic year.
   - Allows students to update their official full name and avatar.

2. **Real-time LeetCode Integration:**
   - Connects using public LeetCode handles (password-free).
   - Direct GraphQL fetching: Total solved, Easy/Medium/Hard breakdown, global ranking, and avatar.
   - Preserves existing statistics if synchronization fails.

3. **Activity Heatmap & Streaks:**
   - 365-day contribution calendar rendering daily problem submissions with hover tooltips.
   - Tracks current active day streak and longest historical streak.

4. **Placement Head Rankings & Tie-Breakers:**
   - Ranked by: Total Problems Solved.
   - Tie-breakers: Active Days → Current Day Streak → Last Activity → USN.
   - Real-time search by name or USN, minimum problems solved filter, and "Connected Only" filter.
   - Inspection modal to view full student profile, heatmap, and recent accepted problems.

5. **Placement Analytics Reports:**
   - Download filtered student rankings as:
     - **CSV:** `DSATM_CodePulse_Rankings.csv`
     - **Excel:** `DSATM_CodePulse_Rankings.xlsx`
     - **Official PDF:** Formatted institutional table report with DSATM header.

6. **Automated Background Synchronization:**
   - Scheduled background worker (via APScheduler) periodically syncs connected LeetCode profiles without Celery or Redis.
   - "Sync Now" button on student dashboard for manual refresh.

