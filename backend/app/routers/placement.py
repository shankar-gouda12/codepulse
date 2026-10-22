from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, nulls_last
from typing import List, Optional
import pandas as pd
import io
from datetime import datetime

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from ..database import get_db
from ..models import User, Student, StudentPlatform, StudentProblem, Problem
from ..dependencies import get_placement_head

router = APIRouter()

def build_student_query(
    db: Session,
    search: Optional[str] = None,
    sort_by: str = "total_problems",
    dept: Optional[str] = None,
    min_solved: Optional[int] = None,
    connected_only: Optional[bool] = None,
):
    query = db.query(Student, StudentPlatform).outerjoin(
        StudentPlatform, 
        (StudentPlatform.student_id == Student.id) & (StudentPlatform.platform == "LEETCODE")
    )
    
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Student.name.ilike(s)) | (Student.usn.ilike(s)))
        
    if dept:
        query = query.filter(Student.department == dept)
        
    if min_solved is not None:
        query = query.filter(StudentPlatform.total_problems >= min_solved)

    if connected_only:
        query = query.filter(StudentPlatform.username != None)
        
    sort_map = {
        "total_problems": StudentPlatform.total_problems,
        "easy": StudentPlatform.easy,
        "medium": StudentPlatform.medium,
        "hard": StudentPlatform.hard,
        "active_days": StudentPlatform.active_days,
        "current_streak": StudentPlatform.current_streak,
        "longest_streak": StudentPlatform.longest_streak,
        "last_active": StudentPlatform.last_active
    }
    
    sort_col = sort_map.get(sort_by, StudentPlatform.total_problems)
    
    # Requirement: ranked by total problems solved, with active days, streaks, and last activity as tie-breakers.
    query = query.order_by(
        desc(sort_col).nulls_last(),
        desc(StudentPlatform.active_days).nulls_last(),
        desc(StudentPlatform.current_streak).nulls_last(),
        desc(StudentPlatform.last_active).nulls_last(),
        asc(Student.usn)
    )
    
    return query

@router.get("/students")
def get_all_students(
    search: Optional[str] = None,
    sort_by: str = Query("total_problems", description="total_problems, easy, medium, hard, active_days, current_streak, last_active"),
    dept: Optional[str] = None,
    min_solved: Optional[int] = Query(None, description="Minimum total problems solved"),
    connected_only: Optional[bool] = Query(None, description="Filter only connected profiles"),
    current_user: User = Depends(get_placement_head),
    db: Session = Depends(get_db)
):
    query = build_student_query(db, search, sort_by, dept, min_solved, connected_only)
    results = query.all()
    
    response = []
    rank = 1
    for student, platform in results:
        is_conn = platform is not None and bool(platform.username)
        response.append({
            "rank": rank,
            "id": student.id,
            "usn": student.usn,
            "name": student.name or "N/A",
            "year": student.year,
            "department": student.department,
            "leetcode_connected": is_conn,
            "username": platform.username if is_conn else None,
            "avatar_url": platform.avatar_url if is_conn else None,
            "global_ranking": platform.ranking if is_conn else None,
            "total_problems": platform.total_problems if is_conn else None,
            "easy": platform.easy if is_conn else None,
            "medium": platform.medium if is_conn else None,
            "hard": platform.hard if is_conn else None,
            "active_days": platform.active_days if is_conn else None,
            "current_streak": platform.current_streak if is_conn else None,
            "longest_streak": platform.longest_streak if is_conn else None,
            "last_active": platform.last_active.isoformat() if (is_conn and platform.last_active) else None,
            "last_synced_at": platform.last_synced_at.isoformat() if (is_conn and platform.last_synced_at) else None,
            "sync_status": platform.sync_status if is_conn else None,
        })
        rank += 1
        
    return response

@router.get("/students/{student_id}")
def get_student_details(
    student_id: int,
    current_user: User = Depends(get_placement_head),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    platform = db.query(StudentPlatform).filter(
        StudentPlatform.student_id == student.id,
        StudentPlatform.platform == "LEETCODE"
    ).first()
    
    recent_problems = []
    if platform:
        recent_problems_query = db.query(StudentProblem, Problem).join(
            Problem, StudentProblem.problem_id == Problem.id
        ).filter(
            StudentProblem.student_id == student.id
        ).order_by(desc(StudentProblem.solved_date), desc(StudentProblem.id)).limit(15).all()

        recent_problems = [
            {
                "title": prob.title,
                "external_id": prob.external_id,
                "url": prob.url,
                "solved_date": sp.solved_date.isoformat() if sp.solved_date else None
            }
            for sp, prob in recent_problems_query
        ]

    is_conn = platform is not None and bool(platform.username)

    return {
        "student": {
            "id": student.id,
            "usn": student.usn,
            "name": student.name or "N/A",
            "department": student.department,
            "year": student.year,
            "dob": student.dob.isoformat() if student.dob else None,
        },
        "leetcode": {
            "connected": is_conn,
            "username": platform.username if is_conn else None,
            "profile_url": platform.profile_url if is_conn else None,
            "avatar_url": platform.avatar_url if is_conn else None,
            "global_ranking": platform.ranking if is_conn else None,
            "verified": platform.verified if is_conn else False,
            "last_synced_at": platform.last_synced_at.isoformat() if (is_conn and platform.last_synced_at) else None,
            "sync_status": platform.sync_status if is_conn else None,
            "sync_error": platform.sync_error if is_conn else None,
            "total_problems": platform.total_problems if is_conn else None,
            "easy": platform.easy if is_conn else None,
            "medium": platform.medium if is_conn else None,
            "hard": platform.hard if is_conn else None,
            "active_days": platform.active_days if is_conn else None,
            "current_streak": platform.current_streak if is_conn else None,
            "longest_streak": platform.longest_streak if is_conn else None,
            "last_active": platform.last_active.isoformat() if (is_conn and platform.last_active) else None,
            "submission_calendar": platform.submission_calendar if is_conn else None,
            "recent_problems": recent_problems
        }
    }

def get_report_data(students_data: list):
    formatted = []
    for s in students_data:
        formatted.append({
            "Rank": s["rank"],
            "USN": s["usn"],
            "Student Name": s["name"] if s["name"] != "N/A" else "Not Entered",
            "Department": s["department"],
            "Year": s["year"],
            "LeetCode Username": s["username"] if s["username"] else "N/A",
            "Total Solved": s["total_problems"] if s["total_problems"] is not None else "N/A",
            "Easy": s["easy"] if s["easy"] is not None else "N/A",
            "Medium": s["medium"] if s["medium"] is not None else "N/A",
            "Hard": s["hard"] if s["hard"] is not None else "N/A",
            "Active Days": s["active_days"] if s["active_days"] is not None else "N/A",
            "Current Streak": s["current_streak"] if s["current_streak"] is not None else "N/A",
            "Longest Streak": s["longest_streak"] if s["longest_streak"] is not None else "N/A",
            "Last Synced": s["last_synced_at"][:10] if s["last_synced_at"] else "N/A"
        })
    return formatted

@router.get("/reports/csv")
def download_csv(
    search: Optional[str] = None,
    sort_by: str = Query("total_problems"),
    dept: Optional[str] = None,
    min_solved: Optional[int] = Query(None),
    connected_only: Optional[bool] = Query(None),
    current_user: User = Depends(get_placement_head),
    db: Session = Depends(get_db)
):
    students_data = get_all_students(
        search=search, sort_by=sort_by, dept=dept, min_solved=min_solved,
        connected_only=connected_only, current_user=current_user, db=db
    )
    report_rows = get_report_data(students_data)
    df = pd.DataFrame(report_rows)
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=DSATM_CodePulse_Rankings.csv"
    return response

@router.get("/reports/excel")
def download_excel(
    search: Optional[str] = None,
    sort_by: str = Query("total_problems"),
    dept: Optional[str] = None,
    min_solved: Optional[int] = Query(None),
    connected_only: Optional[bool] = Query(None),
    current_user: User = Depends(get_placement_head),
    db: Session = Depends(get_db)
):
    students_data = get_all_students(
        search=search, sort_by=sort_by, dept=dept, min_solved=min_solved,
        connected_only=connected_only, current_user=current_user, db=db
    )
    report_rows = get_report_data(students_data)
    df = pd.DataFrame(report_rows)
    
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Rankings")
    stream.seek(0)
    
    response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = "attachment; filename=DSATM_CodePulse_Rankings.xlsx"
    return response

@router.get("/reports/pdf")
def download_pdf(
    search: Optional[str] = None,
    sort_by: str = Query("total_problems"),
    dept: Optional[str] = None,
    min_solved: Optional[int] = Query(None),
    connected_only: Optional[bool] = Query(None),
    current_user: User = Depends(get_placement_head),
    db: Session = Depends(get_db)
):
    students_data = get_all_students(
        search=search, sort_by=sort_by, dept=dept, min_solved=min_solved,
        connected_only=connected_only, current_user=current_user, db=db
    )
    report_rows = get_report_data(students_data)

    stream = io.BytesIO()
    doc = SimpleDocTemplate(
        stream,
        pagesize=landscape(letter),
        rightMargin=20,
        leftMargin=20,
        topMargin=25,
        bottomMargin=20
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DSATMTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#002147'),
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'DSATMSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563'),
        alignment=1 # Center
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=1
    )
    cell_header = ParagraphStyle(
        'CellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    elements = []
    elements.append(Paragraph("DAYANANDA SAGAR INSTITUTIONS", title_style))
    elements.append(Spacer(1, 2))
    elements.append(Paragraph("<b>Academy of Technology & Management (DSATM)</b>", subtitle_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("Department of MCA · Placement Coding Analytics (CodePulse Report)", subtitle_style))
    elements.append(Paragraph(f"Generated on: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')} | Total Students: {len(report_rows)}", subtitle_style))
    elements.append(Spacer(1, 12))

    headers = ["Rank", "USN", "Name", "LeetCode", "Total", "Easy", "Med", "Hard", "Active", "Streak", "Max Streak"]
    table_data = [[Paragraph(h, cell_header) for h in headers]]

    for r in report_rows:
        row = [
            Paragraph(str(r["Rank"]), cell_style),
            Paragraph(str(r["USN"]), cell_style),
            Paragraph(str(r["Student Name"])[:20], cell_style),
            Paragraph(str(r["LeetCode Username"])[:15], cell_style),
            Paragraph(str(r["Total Solved"]), cell_style),
            Paragraph(str(r["Easy"]), cell_style),
            Paragraph(str(r["Medium"]), cell_style),
            Paragraph(str(r["Hard"]), cell_style),
            Paragraph(str(r["Active Days"]), cell_style),
            Paragraph(str(r["Current Streak"]), cell_style),
            Paragraph(str(r["Longest Streak"]), cell_style),
        ]
        table_data.append(row)

    col_widths = [35, 75, 125, 100, 50, 45, 45, 45, 50, 50, 65]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#002147')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))

    elements.append(table)
    doc.build(elements)
    stream.seek(0)

    response = StreamingResponse(stream, media_type="application/pdf")
    response.headers["Content-Disposition"] = "attachment; filename=DSATM_CodePulse_Rankings.pdf"
    return response
