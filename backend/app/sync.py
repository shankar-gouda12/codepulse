import asyncio
import httpx
import json
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, Tuple
from .database import SessionLocal
from .models import StudentPlatform, Problem, StudentProblem, DailyActivity, SyncLog

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

GRAPHQL_QUERY = """
query userProfileAndStats($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar {
      streak
      totalActiveDays
      submissionCalendar
    }
  }
  recentAcSubmissionList(username: $username, limit: 15) {
    id
    title
    titleSlug
    timestamp
  }
}
"""

_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://leetcode.com/",
            "Origin": "https://leetcode.com",
        }
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60)
        _client = httpx.AsyncClient(headers=headers, timeout=8.0, limits=limits)
    return _client

async def fetch_leetcode_profile(username: str) -> Optional[Dict[str, Any]]:
    client = get_http_client()
    try:
        response = await client.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": GRAPHQL_QUERY, "variables": {"username": username}}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching LeetCode profile for {username}: {e}")
        # Retry once if connection was dropped
        try:
            global _client
            if _client:
                await _client.aclose()
            _client = None
            fresh_client = get_http_client()
            response = await fresh_client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": GRAPHQL_QUERY, "variables": {"username": username}}
            )
            response.raise_for_status()
            return response.json()
        except Exception as retry_err:
            print(f"Retry failed for {username}: {retry_err}")
            return None

def compute_streaks_from_calendar(calendar_dict: dict) -> Tuple[int, int]:
    if not calendar_dict:
        return 0, 0
    dates = set()
    for ts_str in calendar_dict.keys():
        try:
            d = datetime.fromtimestamp(int(ts_str)).date()
            dates.add(d)
        except Exception:
            pass
    if not dates:
        return 0, 0

    sorted_dates = sorted(list(dates))
    longest = 1
    current_run = 1
    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[i] - sorted_dates[i-1]).days
        if diff == 1:
            current_run += 1
            if current_run > longest:
                longest = current_run
        elif diff > 1:
            current_run = 1

    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    if sorted_dates[-1] not in (today, yesterday):
        cur_streak = 0
    else:
        cur_streak = 1
        curr = sorted_dates[-1]
        date_set = set(sorted_dates)
        while (curr - timedelta(days=1)) in date_set:
            cur_streak += 1
            curr -= timedelta(days=1)

    return cur_streak, max(longest, cur_streak)

async def async_sync_student_leetcode(
    db: Session,
    platform: StudentPlatform,
    force: bool = False,
    preloaded_data: Optional[Dict[str, Any]] = None
) -> bool:
    # 1-minute caching if not forced to guarantee near real-time updates without spamming
    if not force and not preloaded_data and platform.last_synced_at and (datetime.utcnow() - platform.last_synced_at) < timedelta(minutes=1):
        return True

    try:
        data = preloaded_data if preloaded_data else await fetch_leetcode_profile(platform.username)
        if not data or "errors" in data or not data.get("data", {}).get("matchedUser"):
            platform.sync_status = "ERROR"
            platform.sync_error = "Profile not found or LeetCode API error"
            db.commit()
            return False

        user_data = data["data"]["matchedUser"]
        stats = user_data.get("submitStats", {}).get("acSubmissionNum", [])

        easy = medium = hard = total = 0
        for stat in stats:
            diff = stat.get("difficulty")
            count = stat.get("count", 0)
            if diff == "Easy":
                easy = count
            elif diff == "Medium":
                medium = count
            elif diff == "Hard":
                hard = count
            elif diff == "All":
                total = count

        platform.total_problems = total
        platform.easy = easy
        platform.medium = medium
        platform.hard = hard

        # Profile avatar and rank
        profile = user_data.get("profile", {}) or {}
        if profile.get("userAvatar"):
            platform.avatar_url = profile["userAvatar"]
        if profile.get("ranking"):
            platform.ranking = profile["ranking"]
        platform.profile_url = f"https://leetcode.com/{platform.username}"

        # User calendar & Heatmap
        calendar = user_data.get("userCalendar", {}) or {}
        calendar_str = calendar.get("submissionCalendar", "{}")
        platform.submission_calendar = calendar_str

        calendar_dict = {}
        try:
            calendar_dict = json.loads(calendar_str) if calendar_str else {}
        except Exception:
            pass

        calc_cur_streak, calc_longest_streak = compute_streaks_from_calendar(calendar_dict)
        platform.active_days = calendar.get("totalActiveDays") or len(calendar_dict)
        platform.current_streak = calc_cur_streak
        platform.longest_streak = max(platform.longest_streak or 0, calc_longest_streak, platform.current_streak)

        # Calculate last_active from submissionCalendar
        if calendar_dict:
            try:
                max_ts = max(int(k) for k in calendar_dict.keys())
                platform.last_active = datetime.fromtimestamp(max_ts)
            except Exception:
                pass

        # High-Speed Batch Update: DailyActivity (1 query instead of hundreds)
        existing_acts = {
            act.activity_date: act
            for act in db.query(DailyActivity).filter(DailyActivity.student_id == platform.student_id).all()
        }
        for ts_str, sub_count in calendar_dict.items():
            try:
                act_date = datetime.fromtimestamp(int(ts_str)).date()
                if act_date in existing_acts:
                    existing_acts[act_date].submissions = sub_count
                    existing_acts[act_date].problems_solved = sub_count
                else:
                    new_act = DailyActivity(
                        student_id=platform.student_id,
                        activity_date=act_date,
                        submissions=sub_count,
                        problems_solved=sub_count
                    )
                    db.add(new_act)
                    existing_acts[act_date] = new_act
            except Exception:
                pass

        # High-Speed Batch Update: Recent Submissions
        recent_subs = data["data"].get("recentAcSubmissionList", []) or []
        sub_slugs = [
            sub.get("titleSlug") or sub.get("id")
            for sub in recent_subs
            if (sub.get("titleSlug") or sub.get("id"))
        ]

        existing_problems = {
            p.external_id: p
            for p in db.query(Problem).filter(Problem.external_id.in_(sub_slugs)).all()
        } if sub_slugs else {}

        existing_student_problems = {
            sp.problem_id: sp
            for sp in db.query(StudentProblem).filter(StudentProblem.student_id == platform.student_id).all()
        }

        for sub in recent_subs:
            try:
                sub_id = sub.get("titleSlug") or sub.get("id")
                sub_title = sub.get("title")
                if not sub_id or not sub_title:
                    continue

                if sub_id in existing_problems:
                    problem = existing_problems[sub_id]
                else:
                    problem = Problem(
                        external_id=sub_id,
                        title=sub_title,
                        difficulty="N/A",
                        url=f"https://leetcode.com/problems/{sub.get('titleSlug', '')}/"
                    )
                    db.add(problem)
                    db.flush()
                    existing_problems[sub_id] = problem

                solved_dt = None
                if sub.get("timestamp"):
                    solved_dt = datetime.fromtimestamp(int(sub["timestamp"]))
                    if platform.last_active is None or solved_dt > platform.last_active:
                        platform.last_active = solved_dt

                student_problem = existing_student_problems.get(problem.id)
                if student_problem is None:
                    student_prob = StudentProblem(
                        student_id=platform.student_id,
                        problem_id=problem.id,
                        solved_date=solved_dt,
                        language=None
                    )
                    db.add(student_prob)
                    existing_student_problems[problem.id] = student_prob
                elif solved_dt and (
                    student_problem.solved_date is None
                    or solved_dt > student_problem.solved_date
                ):
                    student_problem.solved_date = solved_dt
            except Exception as e:
                print(f"Error saving problem: {e}")

        platform.last_synced_at = datetime.utcnow()
        platform.sync_status = "SUCCESS"
        platform.sync_error = None
        platform.verified = True

        log = SyncLog(student_platform_id=platform.id, status="SUCCESS", message="Synced stats successfully in real-time")
        db.add(log)
        db.commit()
        return True

    except Exception as e:
        db.rollback()
        platform.sync_status = "ERROR"
        platform.sync_error = str(e)
        log = SyncLog(student_platform_id=platform.id, status="ERROR", message=str(e))
        db.add(log)
        db.commit()
        print(f"Sync failed for {platform.username}: {e}")
        return False

def sync_all_leetcode_profiles():
    """Background periodic sync using concurrent workers for maximum speed."""
    db = SessionLocal()
    try:
        platforms = db.query(StudentPlatform).filter(
            StudentPlatform.platform == "LEETCODE",
            StudentPlatform.username != None,
            StudentPlatform.username != ""
        ).all()
        if not platforms:
            return

        async def sync_all():
            sem = asyncio.Semaphore(5)
            async def sync_one(p):
                async with sem:
                    sub_db = SessionLocal()
                    try:
                        sub_p = sub_db.query(StudentPlatform).filter(StudentPlatform.id == p.id).first()
                        if sub_p:
                            await async_sync_student_leetcode(sub_db, sub_p, force=False)
                    finally:
                        sub_db.close()

            await asyncio.gather(*(sync_one(p) for p in platforms), return_exceptions=True)

        asyncio.run(sync_all())
    except Exception as ex:
        print(f"Error in background sync: {ex}")
    finally:
        db.close()
