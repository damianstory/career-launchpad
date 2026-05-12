#!/usr/bin/env python3
"""Preflight + rollback snapshot for a Skills Canada video takeaway batch.

Reads a per-batch editorial JSON (e.g. life-skills, problems-to-solve, …),
diffs it against live `public.content` rows via PostgREST, and writes a
rollback snapshot. Exits non-zero on any mismatch.

Batch identity is supplied via `--batch <name>`. The script derives:
- input JSON:    scripts/data/copy-updates/skills-canada-<batch>-copy-update.json
- rollback file: scripts/data/copy-updates/skills-canada-<batch>-copy-rollback.json

Per-batch expected counts and category histograms live inside each JSON's
`meta` block, so a single pair of scripts handles every batch.

Env: reads SUPABASE_URL + SUPABASE_ANON_KEY from .env.local or the process
environment. Falls back to SUPABASE_SERVICE_ROLE_KEY if RLS blocks anon.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any


COPY_UPDATES_DIR = Path("scripts/data/copy-updates")
ENV_PATH = Path(".env.local")

REQUIRED_ROW_FIELDS = ("id", "slug", "category", "title",
                      "old_description", "new_takeaway")
REQUIRED_META_FIELDS = ("batch", "expected_count", "expected_histogram")
ID_PREFIX = "skills-canada-"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", required=True,
                        help="Batch name, e.g. life-skills, problems-to-solve")
    args = parser.parse_args()

    json_path = COPY_UPDATES_DIR / f"skills-canada-{args.batch}-copy-update.json"
    rollback_path = COPY_UPDATES_DIR / f"skills-canada-{args.batch}-copy-rollback.json"

    if not json_path.exists():
        print(f"Editorial JSON not found: {json_path}", file=sys.stderr)
        return 1

    data = json.loads(json_path.read_text())
    meta_errors = validate_meta(data, args.batch)
    if meta_errors:
        report("Meta validation failed:", meta_errors)
        return 1

    meta = data["meta"]
    rows = data["rows"]
    json_errors = validate_rows(rows, meta)
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

    write_rollback(meta, rows, live, rollback_path)
    print(f"preflight OK; wrote {rollback_path}")
    return 0


def validate_meta(data: Any, expected_batch: str) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["JSON root must be an object with 'meta' and 'rows' keys"]
    if "meta" not in data or not isinstance(data["meta"], dict):
        errors.append("missing or invalid 'meta' block")
    if "rows" not in data or not isinstance(data["rows"], list):
        errors.append("missing or invalid 'rows' array")
    if errors:
        return errors

    meta = data["meta"]
    for field in REQUIRED_META_FIELDS:
        if field not in meta:
            errors.append(f"meta missing field: {field!r}")

    if errors:
        return errors

    if meta["batch"] != expected_batch:
        errors.append(f"meta.batch is {meta['batch']!r}, expected {expected_batch!r}")
    if not isinstance(meta["expected_count"], int) or meta["expected_count"] <= 0:
        errors.append(f"meta.expected_count must be a positive int, got {meta['expected_count']!r}")
    if not isinstance(meta["expected_histogram"], dict) or not meta["expected_histogram"]:
        errors.append("meta.expected_histogram must be a non-empty object")

    return errors


def validate_rows(rows: list[dict[str, Any]], meta: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    expected_count = meta["expected_count"]
    expected_histogram = meta["expected_histogram"]

    if len(rows) != expected_count:
        errors.append(f"row count is {len(rows)}, expected {expected_count}")

    ids = [r.get("id") for r in rows]
    if len(set(ids)) != len(ids):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        errors.append(f"duplicate ids: {dupes}")

    slugs = [r.get("slug") for r in rows]
    if len(set(slugs)) != len(slugs):
        dupes = sorted({s for s in slugs if slugs.count(s) > 1})
        errors.append(f"duplicate slugs: {dupes}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_ROW_FIELDS if field not in row]
        if missing:
            errors.append(f"row {index} ({row.get('id')}) missing fields: {missing}")
            continue
        value = row["new_takeaway"]
        if not isinstance(value, str) or not value.strip():
            errors.append(f"row {index} ({row['id']}) empty new_takeaway")
        if not isinstance(row["id"], str) or not row["id"].startswith(ID_PREFIX):
            errors.append(f"row {index} ({row['id']}) id must start with {ID_PREFIX!r}")
        if row["category"] not in expected_histogram:
            errors.append(f"row {index} ({row['id']}) unexpected category {row['category']!r}")

    histogram = dict(Counter(r.get("category") for r in rows))
    if histogram != expected_histogram:
        errors.append(f"category histogram is {histogram}, expected {expected_histogram}")

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


def write_rollback(meta: dict[str, Any], rows: list[dict[str, Any]],
                   live: list[dict[str, Any]], rollback_path: Path) -> None:
    by_id = {r["id"]: r for r in live}
    snapshot_rows = []
    for row in rows:
        live_row = by_id[row["id"]]
        snapshot_rows.append({
            "id": row["id"],
            "slug": row["slug"],
            "category": row["category"],
            "title": row["title"],
            "previous_description": live_row.get("description"),
            "previous_takeaway": live_row.get("takeaway"),
        })
    snapshot = {
        "meta": {
            "batch": meta["batch"],
            "expected_count": meta["expected_count"],
            "expected_histogram": meta["expected_histogram"],
        },
        "rows": snapshot_rows,
    }
    rollback_path.parent.mkdir(parents=True, exist_ok=True)
    rollback_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")


def report(header: str, errors: list[str]) -> None:
    print(header, file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
