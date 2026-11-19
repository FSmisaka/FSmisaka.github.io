#!/usr/bin/env python3
"""
sync_handroll.py - generate the _handroll collection from local practice repos.

Sources
  1. LeetCode : ../Algorithm      (notes named 【<num>】title.md, date = first git commit)
  2. RecSys   : ../hand-roll      (one model per file in models/*.py)
  3. LLM      : ../pyre-code      (SQLite progress db, code = latest passed submission)

Each record becomes _handroll/<slug>.md with frontmatter
(layout / title / section / date / order / difficulty / source) and a body
holding the hand-rolled code (or the full note for LeetCode).

Run:  python3 scripts/sync_handroll.py     (then commit the generated files)
Env:  ALGORITHM_DIR / HANDROLL_DIR / PYRE_DIR to override repo locations.
"""

import json
import os
import re
import sqlite3
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

SITE = Path(__file__).resolve().parent.parent
OUT = SITE / "_handroll"

ALGORITHM_DIR = Path(os.environ.get("ALGORITHM_DIR", SITE.parent / "Algorithm"))
HANDROLL_DIR = Path(os.environ.get("HANDROLL_DIR", SITE.parent / "hand-roll"))
PYRE_DIR = Path(os.environ.get("PYRE_DIR", SITE.parent / "pyre-code"))

RECSYS_TITLES = {
    "wide_deep": "Wide & Deep",
    "deepfm": "DeepFM",
    "dcn": "DCN (Deep & Cross)",
    "xdeepfm": "xDeepFM",
    "din": "DIN",
    "autoint": "AutoInt",
}


# ── git helpers ──────────────────────────────────────────────
def git(repo, *args):
    try:
        out = subprocess.run(
            ["git", *args], cwd=repo, capture_output=True, text=True, check=True
        )
        return out.stdout.strip()
    except Exception:
        return None


def first_commit_date(repo, path):
    """Date (YYYY-MM-DD) the file was added; falls back to mtime."""
    out = git(repo, "log", "--diff-filter=A", "--format=%ad",
              "--date=format:%Y-%m-%d", "--", path)
    if out:
        dates = [d.strip() for d in out.splitlines() if d.strip()]
        if dates:
            return dates[-1]  # oldest line = creation commit
    st = (repo / path).stat()
    return datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d")


def github_base(repo):
    url = git(repo, "remote", "get-url", "origin")
    if not url:
        return None
    m = re.match(r"git@github\.com:(.+?)(?:\.git)?$", url) or \
        re.match(r"https://github\.com/(.+?)(?:\.git)?$", url)
    return f"https://github.com/{m.group(1)}" if m else None


def github_blob_url(repo, rel_path):
    base = github_base(repo)
    if not base:
        return None
    branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD") or "master"
    return f"{base}/blob/{branch}/{quote(rel_path)}"


# ── section 1: LeetCode ──────────────────────────────────────

# date marker inside a note: "date: 2025-01-23" or "<!-- date: 2025-01-23 -->"
DATE_MARKER = re.compile(r"^\s*(?:<!--\s*)?[Dd]ate\s*:\s*(\d{4}-\d{2}-\d{2})\s*(?:-->)?\s*$")
MARKER_SCAN_LINES = 10


def extract_date_marker(lines):
    """Return (date, remaining_lines) - the marker line is dropped from the body."""
    for idx, line in enumerate(lines[:MARKER_SCAN_LINES]):
        m = DATE_MARKER.match(line)
        if m:
            return m.group(1), lines[:idx] + lines[idx + 1:]
    return None, lines


def collect_leetcode(records):
    root = ALGORITHM_DIR
    if not root.exists():
        print(f"  ! LeetCode repo not found: {root} (skipped)")
        return
    for md in sorted(root.rglob("*.md")):
        if not md.name.startswith("【"):
            continue
        rel = md.relative_to(root).as_posix()
        m = re.match(r"【([^】]+)】(.+)", md.stem)
        ident = (m.group(1) if m else md.stem).strip()
        title = md.stem
        sanitized = re.sub(r"[^0-9a-zA-Z]+", "-", ident).strip("-").lower()
        if not sanitized:
            sanitized = re.sub(r"[^0-9a-zA-Z]+", "-", title).strip("-").lower() or "misc"
        slug = f"lc-{sanitized}"

        text = md.read_text(encoding="utf-8")
        date, kept_lines = extract_date_marker(text.splitlines())
        body = "\n".join(kept_lines).lstrip("\n")
        if not date:
            # fallback: the git commit that added the note
            date = first_commit_date(root, rel)

        records.append({
            "slug": slug,
            "title": title,
            "section": "leetcode",
            "date": date,
            "source": github_blob_url(root, rel),
            "difficulty": None,
            "body": body,
        })


# ── section 2: RecSys ────────────────────────────────────────
def collect_recsys(records):
    models = HANDROLL_DIR / "models"
    if not models.exists():
        print(f"  ! hand-roll repo not found: {models} (skipped)")
        return
    for py in sorted(models.glob("*.py")):
        if py.name == "__init__.py" or py.name.startswith("_"):
            continue
        stem = py.name[:-3]
        title = RECSYS_TITLES.get(stem, stem)
        code = py.read_text(encoding="utf-8")
        rel = py.relative_to(HANDROLL_DIR).as_posix()
        records.append({
            "slug": f"recsys-{stem.replace('_', '-')}",
            "title": title,
            "section": "recsys",
            "date": first_commit_date(HANDROLL_DIR, rel),
            "source": github_blob_url(HANDROLL_DIR, rel),
            "difficulty": None,
            "body": f"```python\n{code}\n```",
        })


# ── section 3: LLM (pyre-code) ───────────────────────────────
def collect_llm(records):
    db = PYRE_DIR / "data" / "pyre.db"
    problems_file = PYRE_DIR / "web" / "src" / "lib" / "problems.json"
    if not db.exists():
        print(f"  ! pyre-code db not found: {db} (skipped)")
        return

    problems = {}
    if problems_file.exists():
        for p in json.load(open(problems_file, encoding="utf-8")).get("problems", []):
            problems[p.get("id")] = p

    # read-only connection so the WAL is left untouched
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    try:
        solved = con.execute(
            "SELECT task_id, solved_at FROM progress WHERE status='solved'"
        ).fetchall()
    finally:
        con.close()

    for task_id, solved_at in solved:
        con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        try:
            row = con.execute(
                "SELECT code FROM submissions WHERE task_id=? AND passed=1 "
                "ORDER BY submitted_at DESC LIMIT 1",
                (task_id,),
            ).fetchone()
        finally:
            con.close()
        code = row[0] if row else ""
        prob = problems.get(task_id, {})
        title = prob.get("title") or task_id
        records.append({
            "slug": f"llm-{task_id.replace('_', '-')}",
            "title": title,
            "section": "llm",
            "date": (solved_at or "")[:10],
            "source": None,
            "difficulty": prob.get("difficulty"),
            "body": f"```python\n{code}\n```",
        })


# ── write collection ─────────────────────────────────────────
def write_collection(records):
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.md"):
        old.unlink()

    seen = {}
    count = 0
    for r in records:
        slug = r["slug"]
        if slug in seen:  # duplicate slug (e.g. same LC number twice) - suffix it
            seen[slug] += 1
            slug = f"{slug}-{seen[slug]}"
        else:
            seen[slug] = 1

        fm = ["---",
              "layout: handroll-detail",
              f"title: {json.dumps(r['title'], ensure_ascii=False)}",
              f"section: {r['section']}",
              f"date: {r['date']}",
              f"order: {re.sub(r'[^0-9]', '', r['date'])}"]
        if r["difficulty"]:
            fm.append(f"difficulty: {json.dumps(r['difficulty'])}")
        if r["source"]:
            fm.append(f"source: {json.dumps(r['source'])}")
        fm.append("---")

        (OUT / f"{slug}.md").write_text("\n".join(fm) + "\n\n" + r["body"] + "\n",
                                        encoding="utf-8")
        count += 1
    return count


def main():
    print("Syncing hand-roll records ...")
    records = []
    collect_leetcode(records)
    collect_recsys(records)
    collect_llm(records)

    n = write_collection(records)
    by_sec = {}
    for r in records:
        by_sec[r["section"]] = by_sec.get(r["section"], 0) + 1
    summary = ", ".join(f"{k}: {v}" for k, v in sorted(by_sec.items()))
    print(f"  wrote {n} records to _handroll/ ({summary})")
    print("  remember to commit the generated files.")


if __name__ == "__main__":
    main()
