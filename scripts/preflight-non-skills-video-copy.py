#!/usr/bin/env python3
"""Preflight + rollback snapshot for the non-Skills Canada video copy refresh.

Reads SUPABASE_URL and SUPABASE_ANON_KEY from .env.local (or the process
environment). Fetches live non-Skills-Canada published video rows via
PostgREST, diffs them against the editorial JSON, and writes a rollback
snapshot. Exits non-zero on any mismatch.

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


JSON_PATH = Path("scripts/data/copy-updates/non-skills-video-copy-update.json")
ROLLBACK_PATH = Path("scripts/data/copy-updates/non-skills-video-copy-rollback.json")
ENV_PATH = Path(".env.local")

EXPECTED_ROW_COUNT = 68
EXPECTED_HISTOGRAM = {"on-the-job": 43, "emerging-careers": 25}
ALLOWED_COHORTS = {"advice-with-erin", "max-klymenko", "cleo-abram"}
REQUIRED_FIELDS = ("slug", "category", "source_cohort", "title",
                   "old_description", "new_description", "new_takeaway")


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
        live = fetch_live(env)
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

    slugs = [r.get("slug") for r in rows]
    if len(set(slugs)) != len(slugs):
        dupes = sorted({s for s in slugs if slugs.count(s) > 1})
        errors.append(f"duplicate slugs: {dupes}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_FIELDS if field not in row]
        if missing:
            errors.append(f"row {index} ({row.get('slug')}) missing fields: {missing}")
            continue
        for field in ("new_description", "new_takeaway"):
            value = row[field]
            if not isinstance(value, str) or not value.strip():
                errors.append(f"row {index} ({row['slug']}) empty {field}")
        if row["category"] not in EXPECTED_HISTOGRAM:
            errors.append(f"row {index} ({row['slug']}) unexpected category {row['category']!r}")
        if row["source_cohort"] not in ALLOWED_COHORTS:
            errors.append(f"row {index} ({row['slug']}) unexpected source_cohort {row['source_cohort']!r}")

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
    for column in ("takeaway", "why_it_matters", "planning_connection", "reflection"):
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


def fetch_live(env: dict[str, str]) -> list[dict[str, Any]]:
    url = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("missing SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY")

    query = urllib.parse.urlencode({
        "select": "id,slug,description,takeaway",
        "content_type": "eq.video",
        "is_published": "eq.true",
        "id": "not.like.skills-canada-*",
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

    sc_leak = [r["id"] for r in live if isinstance(r.get("id"), str) and r["id"].startswith("skills-canada-")]
    if sc_leak:
        errors.append(f"PostgREST returned Skills Canada rows (filter failed): {sc_leak[:5]}")

    live_slugs = {r["slug"] for r in live}
    json_slugs = {r["slug"] for r in rows}

    missing = sorted(json_slugs - live_slugs)
    extra = sorted(live_slugs - json_slugs)
    if missing:
        errors.append(f"JSON has slugs not in live DB: {missing}")
    if extra:
        errors.append(f"Live DB has slugs not in JSON: {extra}")

    return errors


def write_rollback(rows: list[dict[str, Any]], live: list[dict[str, Any]]) -> None:
    by_slug = {r["slug"]: r for r in live}
    snapshot = []
    for row in rows:
        live_row = by_slug[row["slug"]]
        snapshot.append({
            "slug": row["slug"],
            "category": row["category"],
            "source_cohort": row["source_cohort"],
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
