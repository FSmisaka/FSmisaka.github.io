#!/usr/bin/env python3
"""Refresh code-activity snapshots used by the homepage "Coding Ledger".

Writes (atomically, only on success):
  assets/data/contributions.json  — GitHub contribution calendars (Green-Wall API)
  assets/data/leetcode.json       — leetcode.cn stats + full submission calendar

Data sources:
  * GitHub  : Green-Wall public API  https://github.com/Codennnn/Green-Wall
  * LeetCode: leetcode.cn GraphQL (same spirit as
    https://github.com/blackscythe123/github-readme-leetcode-stats, whose data
    layer targets leetcode.com and cannot read leetcode.cn accounts).

Std-lib only, so the GitHub Action needs no extra installs.
"""

import datetime
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT, "scripts", "code-tracker.json")
DATA_DIR = os.path.join(ROOT, "assets", "data")

LEVEL_MAP = {
    "NONE": 0,
    "FIRST_QUARTILE": 1,
    "SECOND_QUARTILE": 2,
    "THIRD_QUARTILE": 3,
    "FOURTH_QUARTILE": 4,
}


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(name, obj):
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, name)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    os.replace(tmp, path)
    print("wrote %s" % path)


def http_json(url, headers=None, timeout=45):
    merged = {
        "Accept": "application/json",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
    }
    merged.update(headers or {})
    req = urllib.request.Request(url, data=None, headers=merged)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


# --------------------------------------------------------------------------
# GitHub — Green-Wall contribution API
# --------------------------------------------------------------------------

def fetch_github(config):
    user = config["github_username"]
    url = config["github_contrib_api"] + urllib.parse.quote(user, safe="")
    payload = http_json(url)
    data = payload.get("data") or payload
    calendars = []
    for cal in data["contributionCalendars"]:
        weeks = []
        for week in cal["weeks"]:
            weeks.append(
                [
                    [int(day["count"]), LEVEL_MAP.get(day.get("level"), 0), day["date"]]
                    for day in week["days"]
                ]
            )
        calendars.append({"year": int(cal["year"]), "total": int(cal["total"]), "weeks": weeks})
    return {
        "updated_at": now_iso(),
        "user": data["login"],
        "name": data["name"],
        "calendars": calendars,
    }


def fetch_leetcode(config):
    cn = config["leetcode_cn_graphql"].rstrip("/") + "/"
    noj = config["leetcode_cn_noj_go"].rstrip("/") + "/"
    username = config["leetcode_username"]
    ua = config["user_agent"]

    # 1) establish csrf cookie pair, exactly like LeetCode's own web client
    #    (the 400 response to the bare GET is normal — it still sets cookies)
    import http.cookiejar  # noqa: E402

    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        opener.open(urllib.request.Request(cn, headers={"User-Agent": ua}), timeout=45)
    except Exception:
        pass
    csrf = next((c.value for c in jar if c.name == "csrftoken"), "")

    def cn_post(endpoint, query, variables):
        body = json.dumps({"query": query, "variables": variables}).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Origin": cn.rstrip("/"),
                "Referer": cn.rstrip("/"),
                "User-Agent": ua,
                "x-csrftoken": csrf,
            },
        )
        with opener.open(req, timeout=60) as res:
            payload = json.loads(res.read().decode("utf-8"))
        if payload.get("errors"):
            raise RuntimeError(payload["errors"])
        return payload["data"]

    # profile — solved/attempted counts per difficulty + public info
    profile_data = cn_post(
        cn,
        """
        query getUserProfile($username: String!) {
          userProfileUserQuestionProgress(userSlug: $username) {
            numAcceptedQuestions { count difficulty }
            numFailedQuestions { count difficulty }
            numUntouchedQuestions { count difficulty }
          }
          userProfilePublicProfile(userSlug: $username) {
            siteRanking
            profile { userSlug realName userAvatar }
          }
        }
        """,
        {"username": username},
    )

    # calendar + languages + skill tags
    stats_data = cn_post(
        noj,
        """
        query getStats($userSlug: String!) {
          userCalendar(userSlug: $userSlug) {
            submissionCalendar
            activeYears
            streak
            totalActiveDays
          }
          userLanguageProblemCount(userSlug: $userSlug) { languageName problemsSolved }
          userTagProblemCounts(userSlug: $userSlug) {
            fundamental { tagName slug problemsSolved }
            intermediate { tagName slug problemsSolved }
            advanced { tagName slug problemsSolved }
          }
        }
        """,
        {"userSlug": username},
    )

    # the default calendar only covers the trailing ~12 months — fan out one
    # small per-year query (exactly like github-readme-leetcode-stats does)
    prog = profile_data["userProfileUserQuestionProgress"]
    pub = profile_data["userProfilePublicProfile"]
    cal = stats_data["userCalendar"]
    raw_cal = json.loads(cal["submissionCalendar"])
    for year in cal.get("activeYears") or []:
        year_data = cn_post(
            noj,
            """
            query getYear($userSlug: String!, $year: Int) {
              userCalendar(userSlug: $userSlug, year: $year) { submissionCalendar }
            }
            """,
            {"userSlug": username, "year": year},
        )
        year_cal = year_data["userCalendar"]["submissionCalendar"]
        if year_cal:
            raw_cal.update(json.loads(year_cal))

    def by_difficulty(rows):
        out = {}
        for row in rows:
            out[row["difficulty"]] = int(row["count"])
        return out

    solved = by_difficulty(prog["numAcceptedQuestions"])
    attempted = by_difficulty(prog["numFailedQuestions"])
    untouched = by_difficulty(prog["numUntouchedQuestions"])
    total = {
        d: solved.get(d, 0) + attempted.get(d, 0) + untouched.get(d, 0)
        for d in ("EASY", "MEDIUM", "HARD")
    }

    # submission calendar: {"<epoch seconds>": count} -> {epoch day: count}
    calendar = {}
    for sec, count in raw_cal.items():
        day = int(sec) // 86400
        calendar[day] = calendar.get(day, 0) + int(count)

    languages = sorted(
        (
            {"name": row["languageName"], "count": int(row["problemsSolved"])}
            for row in stats_data["userLanguageProblemCount"]
            if int(row["problemsSolved"]) > 0
        ),
        key=lambda r: -r["count"],
    )

    tags = stats_data["userTagProblemCounts"]
    skills = {}
    for tier in ("fundamental", "intermediate", "advanced"):
        for row in tags.get(tier, []):
            key = row.get("slug") or row["tagName"]
            skills[key] = skills.get(key, 0) + int(row["problemsSolved"])
    skills = sorted(
        ({"name": name, "count": count} for name, count in skills.items()),
        key=lambda r: -r["count"],
    )

    active_days = sorted(d for d, c in calendar.items() if c > 0)
    today = int(time.time()) // 86400
    highest, run = 0, 0
    for i, day in enumerate(active_days):
        run = run + 1 if i > 0 and day == active_days[i - 1] + 1 else 1
        highest = max(highest, run)

    # current streak: the run that ends today or yesterday (LeetCode's own count)
    current = int(cal.get("streak") or 0)
    profile = pub["profile"] or {}

    total_solved = sum(
        solved.get(d, 0) for d in ("EASY", "MEDIUM", "HARD")
    )
    total_questions = sum(total.get(d, 0) for d in ("EASY", "MEDIUM", "HARD"))

    return {
        "updated_at": now_iso(),
        "source": "leetcode.cn",
        "username": profile.get("userSlug") or username,
        "realName": profile.get("realName"),
        "rank": int(pub.get("siteRanking") or 0),
        "solved": {
            "easy": {"solved": solved.get("EASY", 0), "total": total["EASY"]},
            "medium": {"solved": solved.get("MEDIUM", 0), "total": total["MEDIUM"]},
            "hard": {"solved": solved.get("HARD", 0), "total": total["HARD"]},
            "total": total_solved,
            "totalQuestions": total_questions,
        },
        "attempted": {
            "easy": attempted.get("EASY", 0),
            "medium": attempted.get("MEDIUM", 0),
            "hard": attempted.get("HARD", 0),
        },
        "streak": {"current": current, "highest": highest},
        # active days across the merged all-years calendar (not just the 12-month window)
        "totalActiveDays": len(active_days),
        "totalSubmissions": sum(calendar.values()),
        "languages": languages[:10],
        "skills": skills[:12],
        "calendar": {str(d): c for d, c in calendar.items()},
    }


def main():
    config = load_config()
    results = {}
    for name, fn in (("github", fetch_github), ("leetcode", fetch_leetcode)):
        try:
            results[name] = fn(config)
            print("ok %s" % name)
        except Exception as exc:  # keep the previous snapshot on failure
            print("SKIP %s: %s" % (name, exc), file=sys.stderr)
    if results.get("github"):
        write_json("contributions.json", results["github"])
    if results.get("leetcode"):
        write_json("leetcode.json", results["leetcode"])
    if not results:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
