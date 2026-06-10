r"""
Import career-ops tracker data into autoapply.ai database.

Usage:
    python scripts/import_career_ops.py --source /path/to/career-ops
"""

import argparse
import os
import sys
import re
import csv
import io
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.database import SessionLocal, init_db, Application, ApplicationEvent, ScanHistory
from app.services.auth import get_current_user


def parse_markdown_table(filepath: str) -> list[dict]:
    """Parse a markdown table into a list of dicts."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.strip().split("\n")
    header_line = None
    separator_line = None
    data_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            if header_line is None:
                header_line = stripped
            elif separator_line is None:
                separator_line = stripped
            else:
                data_lines.append(stripped)

    if not header_line:
        print(f"  No table found in {filepath}")
        return []

    headers = [h.strip() for h in header_line.strip("|").split("|")]
    rows = []
    for dl in data_lines:
        cells = [c.strip() for c in dl.strip("|").split("|")]
        rows.append(dict(zip(headers, cells)))

    return rows


def parse_score(score_str: str) -> tuple:
    """Parse '3.5/5' into (match_score int, score_rating str)."""
    match = re.match(r"([\d.]+)\s*/\s*(\d+)", str(score_str))
    if match:
        num = float(match.group(1))
        den = float(match.group(2))
        pct = int((num / den) * 100) if den else 0
        return pct, str(score_str)
    try:
        return int(score_str), None
    except (ValueError, TypeError):
        return None, None


def parse_date(date_str: str) -> str:
    """Parse date string to ISO format."""
    try:
        dt = datetime.strptime(str(date_str).strip(), "%Y-%m-%d")
        return dt.isoformat()
    except ValueError:
        return None


def normalize_status(status: str) -> str:
    """Normalize career-ops status to application status."""
    mapping = {
        "evaluated": "evaluated",
        "applied": "applied",
        "submitted": "applied",
        "responded": "responded",
        "interview": "interview",
        "offer": "offer",
        "rejected": "rejected",
        "discarded": "discarded",
        "skip": "skip",
        "queued": "queued",
        "confirmed": "confirmed",
        "failed": "failed",
    }
    s = str(status).strip().lower()
    return mapping.get(s, s)


def import_applications(source_dir: str, user_id: str = "test-user-123", dry_run: bool = False):
    """Import applications.md entries."""
    apps_path = os.path.join(source_dir, "data", "applications.md")
    sent_path = os.path.join(source_dir, "data", "applications-sent.md")

    if not os.path.exists(apps_path):
        print(f"  File not found: {apps_path}")
        return []

    print(f"\nReading: {apps_path}")
    rows = parse_markdown_table(apps_path)
    print(f"  Found {len(rows)} entries")

    sent_rows = []
    if os.path.exists(sent_path):
        print(f"Reading: {sent_path}")
        sent_rows = parse_markdown_table(sent_path)
        print(f"  Found {len(sent_rows)} entries")

    sent_lookup = {}
    for sr in sent_rows:
        key = (sr.get("Company", "").strip().lower(), sr.get("Role", "").strip().lower())
        sent_lookup[key] = sr

    reports_dir = os.path.join(source_dir, "reports")
    target_reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")
    os.makedirs(target_reports_dir, exist_ok=True)

    imported = []
    for row in rows:
        company = row.get("Company", "").strip()
        role = row.get("Role", "").strip()
        score_str = row.get("Score", "").strip()
        status = normalize_status(row.get("Status", "").strip())
        notes = row.get("Notes", "").strip()
        pdf_raw = row.get("PDF", "").strip()
        report_link = row.get("Report", "").strip()
        row_num = row.get("#", "").strip()
        date_str = row.get("Date", "").strip()

        has_pdf = pdf_raw in ("✅", "✔", "Y", "yes", "true")
        report_num = None
        report_path = None
        if report_link:
            m = re.search(r"\[(\d+)\]\((.+?)\)", report_link)
            if m:
                report_num = m.group(1)
                rel_path = m.group(2)
                report_path = os.path.join(source_dir, rel_path)
                if os.path.exists(report_path):
                    dest = os.path.join(target_reports_dir, os.path.basename(rel_path))
                    if not os.path.exists(dest) and not dry_run:
                        import shutil
                        shutil.copy2(report_path, dest)
                        print(f"  Copied report: {os.path.basename(rel_path)}")

                report_path = os.path.join("reports", os.path.basename(rel_path))

        key = (company.lower(), role.lower())
        sent = sent_lookup.get(key, {})
        portal = sent.get("Portal", "").strip()
        cv_used = sent.get("CV Used", "").strip()
        sent_status = sent.get("Status", "").strip()
        sent_notes = sent.get("Notes", "").strip()

        if sent_notes and sent_notes not in notes:
            notes = f"{notes}; {sent_notes}" if notes else sent_notes

        match_score, score_rating = parse_score(score_str)

        applied_at = parse_date(date_str)

        if dry_run:
            print(f"  [DRY RUN] Would import: {company} - {role} ({status}, {score_rating or match_score})")
            imported.append({
                "company": company,
                "role": role,
                "status": status,
                "score_rating": score_rating,
                "match_score": match_score,
                "has_pdf": has_pdf,
                "report_number": report_num,
                "report_path": report_path,
                "portal": portal,
                "cv_used": cv_used,
                "notes": notes,
                "applied_at": applied_at,
            })
            continue

        app = Application(
            user_id=user_id,
            job_title=role,
            company_name=company,
            status=status,
            match_score=match_score,
            score_rating=score_rating,
            has_pdf=has_pdf,
            report_number=report_num,
            report_path=report_path,
            portal=portal,
            cv_used=cv_used,
            notes=notes,
            applied_at=datetime.fromisoformat(applied_at) if applied_at else None,
        )
        imported.append(app)

    if not dry_run:
        db = SessionLocal()
        try:
            for app in imported:
                existing = db.query(Application).filter(
                    Application.company_name == app.company_name,
                    Application.job_title == app.job_title,
                    Application.user_id == user_id,
                ).first()
                if existing:
                    for key, value in vars(app).items():
                        if key not in ("id", "_sa_instance_state", "created_at", "updated_at") and value is not None:
                            setattr(existing, key, value)
                    print(f"  Updated: {app.company_name} - {app.job_title}")
                else:
                    db.add(app)
                    db.flush()
                    event = ApplicationEvent(
                        application_id=app.id,
                        event_type="imported",
                        message="Imported from career-ops tracker",
                        payload={"source": "career-ops"}
                    )
                    db.add(event)
                    print(f"  Imported: {app.company_name} - {app.job_title}")
            db.commit()
        finally:
            db.close()

    return imported


def import_scan_history(source_dir: str, user_id: str = "test-user-123", dry_run: bool = False):
    """Import scan history TSV if available."""
    tsv_path = os.path.join(source_dir, "data", "scan-history.tsv")
    if not os.path.exists(tsv_path):
        print(f"\nNo scan-history.tsv found at {tsv_path}")
        return []

    print(f"\nReading: {tsv_path}")
    with open(tsv_path, "r", encoding="utf-8") as f:
        content = f.read()

    reader = csv.DictReader(io.StringIO(content), delimiter="\t")
    rows = list(reader)
    print(f"  Found {len(rows)} entries")

    imported = []
    for row in rows:
        if dry_run:
            company = row.get('company', '') or ''
            title = row.get('title', '') or ''
            safe = f"{company} - {title}".encode('utf-8', errors='replace').decode('utf-8')
            print(f"  [DRY RUN] Would import scan: {safe}")
            continue

        scan = ScanHistory(
            user_id=user_id,
            job_url=row.get("url", ""),
            title=row.get("title", ""),
            company=row.get("company", ""),
            location=row.get("location", ""),
            portal=row.get("portal", ""),
            status=row.get("status", "pending"),
            first_seen=datetime.utcnow(),
            last_seen=datetime.utcnow(),
        )
        imported.append(scan)

    if not dry_run and imported:
        db = SessionLocal()
        try:
            for scan in imported:
                db.add(scan)
            db.commit()
            print(f"  Imported {len(imported)} scan history entries")
        finally:
            db.close()

    return imported


def main():
    parser = argparse.ArgumentParser(description="Import career-ops tracker data into autoapply.ai")
    parser.add_argument("--source", required=True, help="Path to career-ops repository root")
    parser.add_argument("--user-id", default="test-user-123", help="User ID to assign entries to")
    parser.add_argument("--dry-run", action="store_true", help="Preview import without writing")
    args = parser.parse_args()

    source_dir = os.path.abspath(args.source)
    if not os.path.exists(source_dir):
        print(f"Error: Source directory not found: {source_dir}")
        sys.exit(1)

    if not args.dry_run:
        print("Initializing database...")
        init_db()

    print(f"\n{'='*60}")
    print(f"Importing from: {source_dir}")
    print(f"User ID: {args.user_id}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"{'='*60}")

    apps = import_applications(source_dir, args.user_id, args.dry_run)
    scans = import_scan_history(source_dir, args.user_id, args.dry_run)

    print(f"\n{'='*60}")
    if args.dry_run:
        print(f"DRY RUN complete. Would import {len(apps)} applications and {len(scans)} scan entries.")
    else:
        print(f"Import complete. Imported {len(apps)} applications and {len(scans)} scan entries.")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
