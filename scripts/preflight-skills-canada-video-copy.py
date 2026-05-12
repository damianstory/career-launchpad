#!/usr/bin/env python3
"""Preflight + rollback snapshot for the Skills Canada video copy refresh.

Reads SUPABASE_URL and SUPABASE_ANON_KEY from .env.local (or the process
environment). Fetches live Skills Canada published video rows via PostgREST,
diffs them against the editorial JSON, and writes a rollback snapshot. Exits
non-zero on any mismatch.

Targets only the ids present in the editorial JSON (e.g. an 8-row pilot
batch). Unlike the non-SC preflight, this script keys on `id`, not slug —
Skills Canada rows have stable `skills-canada-NNN` ids assigned in their seed
migration, which makes the diff cheaper to verify.

If RLS blocks the anon key from reading public.content, set
SUPABASE_SERVICE_ROLE_KEY in the environment and the script will use that
instead.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any


JSON_PATH = Path("scripts/data/copy-updates/skills-canada-video-copy-update.json")
ROLLBACK_PATH = Path("scripts/data/copy-updates/skills-canada-video-copy-rollback.json")
ENV_PATH = Path(".env.local")

EXPECTED_ROW_COUNT = 8
EXPECTED_HISTOGRAM = {"life-skills": 8}
REQUIRED_FIELDS = ("id", "slug", "category", "title",
                   "old_description", "new_takeaway")
ID_PREFIX = "skills-canada-"


def main() -> int:
    rows = json.loads(JSON_PATH.read_text())
    json_errors = validate_json(rows)
    if json_errors:
        report("JSON validation failed:", json_errors)
        return 1

    env = load_env()
    schema_errors = check_schema(env)
    if schema_errors:
        report("Schema preflight failed:", schema_errors)
        return 1

    try:
        live = fetch_live(env, [r["id"] for r in rows])
    except Exception as exc:
        print(f"Failed to fetch live rows: {exc}", file=sys.stderr)
        return 1

    diff_errors = validate_against_live(rows, live)
    if diff_errors:
        report("Live diff failed:", diff_errors)
        return 1

    write_rollback(rows, live)
    print(f"preflight OK; wrote {ROLLBACK_PATH}")
    return 0


def validate_json(rows: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []

    if len(rows) != EXPECTED_ROW_COUNT:
        errors.append(f"row count is {len(rows)}, expected {EXPECTED_ROW_COUNT}")

    ids = [r.get("id") for r in rows]
    if len(set(ids)) != len(ids):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        errors.append(f"duplicate ids: {dupes}")

    slugs = [r.get("slug") for r in rows]
    if len(set(slugs)) != len(slugs):
        dupes = sorted({s for s in slugs if slugs.count(s) > 1})
        errors.append(f"duplicate slugs: {dupes}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_FIELDS if field not in row]
        if missing:
            errors.append(f"row {index} ({row.get('id')}) missing fields: {missing}")
            continue
        value = row["new_takeaway"]
        if not isinstance(value, str) or not value.strip():
            errors.append(f"row {index} ({row['id']}) empty new_takeaway")
        if not isinstance(row["id"], str) or not row["id"].startswith(ID_PREFIX):
            errors.append(f"row {index} ({row['id']}) id must start with {ID_PREFIX!r}")
        if row["category"] not in EXPECTED_HISTOGRAM:
            errors.append(f"row {index} ({row['id']}) unexpected category {row['category']!r}")

    histogram = dict(Counter(r.get("category") for r in rows))
    if histogram != EXPECTED_HISTOGRAM:
        errors.append(f"category histogram is {histogram}, expected {EXPECTED_HISTOGRAM}")

    return errors


def load_env() -> dict[str, str]:
    env = {**os.environ}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env.setdefault(key.strip(), value.strip())
    return env


def check_schema(env: dict[str, str]) -> list[str]:
    """Confirm that the Learn More columns exist on public.content.

    Should never fail in a fully-migrated environment. If it does, migration
    `20260508185237_launchpad_learn_more_and_slug_rename.sql` has not been
    applied to this Supabase project and must be applied before the copy
    refresh.
    """
    errors: list[str] = []
    url = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_ANON_KEY")
    if not url or not key:
        return ["missing SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY"]

    missing: list[str] = []
    for column in ("takeaway", "why_it_matters", "planning_connection"):
        query = urllib.parse.urlencode({"select": column, "limit": "0"})
        request = urllib.request.Request(
            f"{url.rstrip('/')}/rest/v1/content?{query}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        try:
            urllib.request.urlopen(request, timeout=15).read()
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")
            if exc.code == 400 and '"42703"' in body and column in body:
                missing.append(column)
            else:
                errors.append(f"unexpected error probing column {column!r}: {exc.code} {body[:200]}")

    if missing:
        errors.append(
            f"column(s) missing on public.content: {missing}. Apply "
            "supabase/migrations/20260508185237_launchpad_learn_more_and_slug_rename.sql "
            "before running this preflight."
        )

    return errors


def fetch_live(env: dict[str, str], ids: list[str]) -> list[dict[str, Any]]:
    url = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("missing SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY")

    ids_filter = "in.(" + ",".join(ids) + ")"
    query = urllib.parse.urlencode({
        "select": "id,slug,description,takeaway",
        "content_type": "eq.video",
        "is_published": "eq.true",
        "id": ids_filter,
    })
    request = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/content?{query}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as resp:
        return json.loads(resp.read().decode())


def validate_against_live(rows: list[dict[str, Any]], live: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []

    non_sc_leak = [
        r["id"] for r in live
        if not (isinstance(r.get("id"), str) and r["id"].startswith(ID_PREFIX))
    ]
    if non_sc_leak:
        errors.append(f"PostgREST returned non-Skills-Canada rows (filter failed): {non_sc_leak[:5]}")

    live_ids = {r["id"] for r in live}
    json_ids = {r["id"] for r in rows}

    missing = sorted(json_ids - live_ids)
    extra = sorted(live_ids - json_ids)
    if missing:
        errors.append(f"JSON has ids not in live DB: {missing}")
    if extra:
        errors.append(f"Live DB has ids not in JSON: {extra}")

    by_id = {r["id"]: r for r in live}
    slug_mismatches = []
    for row in rows:
        live_row = by_id.get(row["id"])
        if live_row is None:
            continue
        if live_row.get("slug") != row.get("slug"):
            slug_mismatches.append(
                f"{row['id']}: JSON slug {row['slug']!r} vs live {live_row.get('slug')!r}"
            )
    if slug_mismatches:
        errors.append("slug drift between JSON and live DB: " + "; ".join(slug_mismatches))

    return errors


def write_rollback(rows: list[dict[str, Any]], live: list[dict[str, Any]]) -> None:
    by_id = {r["id"]: r for r in live}
    snapshot = []
    for row in rows:
        live_row = by_id[row["id"]]
        snapshot.append({
            "id": row["id"],
            "slug": row["slug"],
            "category": row["category"],
            "title": row["title"],
            "previous_description": live_row.get("description"),
            "previous_takeaway": live_row.get("takeaway"),
        })
    ROLLBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    ROLLBACK_PATH.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")


def report(header: str, errors: list[str]) -> None:
    print(header, file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
