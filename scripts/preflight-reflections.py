#!/usr/bin/env python3
"""Preflight + rollback snapshot for a reflection backfill batch.

Reads a generic reflections JSON via `--input <path>`, validates editorial
rule constraints (word count, second-person, ends with '?', no em-dash),
diffs against live `public.content`, and writes a rollback snapshot next
to the input file. Exits non-zero on any mismatch.

JSON shape:
    {
      "meta": {
        "label": "skills-canada-life-skills",   # free-form, used in messages
        "expected_count": 8                      # must equal len(rows)
      },
      "rows": [
        {"id": "skills-canada-001", "reflection": "..."},
        ...
      ]
    }

Env: reads SUPABASE_URL + SUPABASE_ANON_KEY from .env.local or the process
environment. Falls back to SUPABASE_SERVICE_ROLE_KEY if RLS blocks anon.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ENV_PATH = Path(".env.local")

REQUIRED_ROW_FIELDS = ("id", "reflection")
REQUIRED_META_FIELDS = ("label", "expected_count")

WORD_MIN = 20
WORD_MAX = 50
SECOND_PERSON_RE = re.compile(r"\byou(?:r|rs|rself)?\b", re.IGNORECASE)
EM_DASH = "—"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path,
                        help="Path to reflections JSON")
    parser.add_argument("--output", type=Path, default=None,
                        help="Rollback snapshot path (default: sibling -rollback.json)")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Reflections JSON not found: {args.input}", file=sys.stderr)
        return 1

    data = json.loads(args.input.read_text())
    meta_errors = validate_meta(data)
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

    rollback_path = args.output or default_rollback_path(args.input)
    write_rollback(meta, rows, live, rollback_path)
    print(f"preflight OK ({meta['label']}, {len(rows)} rows); wrote {rollback_path}")
    return 0


def validate_meta(data: Any) -> list[str]:
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

    if not isinstance(meta["label"], str) or not meta["label"].strip():
        errors.append("meta.label must be a non-empty string")
    if not isinstance(meta["expected_count"], int) or meta["expected_count"] <= 0:
        errors.append(f"meta.expected_count must be a positive int, got {meta['expected_count']!r}")
    return errors


def validate_rows(rows: list[dict[str, Any]], meta: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    expected_count = meta["expected_count"]

    if len(rows) != expected_count:
        errors.append(f"row count is {len(rows)}, expected {expected_count}")

    ids = [r.get("id") for r in rows]
    if len(set(ids)) != len(ids):
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        errors.append(f"duplicate ids: {dupes}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_ROW_FIELDS if field not in row]
        if missing:
            errors.append(f"row {index} ({row.get('id')}) missing fields: {missing}")
            continue
        errors.extend(validate_editorial_rule(index, row))

    return errors


def validate_editorial_rule(index: int, row: dict[str, Any]) -> list[str]:
    """Enforce: 12-28 words, second-person, ends with '?', no em-dash, non-empty."""
    errors: list[str] = []
    rid = row.get("id")
    value = row["reflection"]

    if not isinstance(value, str) or not value.strip():
        errors.append(f"row {index} ({rid}) empty reflection")
        return errors

    text = value.strip()
    word_count = len(text.split())

    if word_count < WORD_MIN or word_count > WORD_MAX:
        errors.append(
            f"row {index} ({rid}) reflection has {word_count} words; "
            f"expected {WORD_MIN}-{WORD_MAX}"
        )
    if not SECOND_PERSON_RE.search(text):
        errors.append(f"row {index} ({rid}) reflection must use second-person ('you'/'your')")
    if not text.endswith("?"):
        errors.append(f"row {index} ({rid}) reflection must end with '?'")
    if EM_DASH in text:
        errors.append(f"row {index} ({rid}) reflection contains em-dash; use a comma or colon")

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
    """Confirm the reflection column exists on public.content."""
    errors: list[str] = []
    url = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_ANON_KEY")
    if not url or not key:
        return ["missing SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY"]

    query = urllib.parse.urlencode({"select": "reflection", "limit": "0"})
    request = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/content?{query}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    try:
        urllib.request.urlopen(request, timeout=15).read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")
        if exc.code == 400 and '"42703"' in body and "reflection" in body:
            errors.append(
                "column 'reflection' missing on public.content. Apply migration "
                "supabase/migrations/20260521170000_add_content_reflection.sql "
                "before running this preflight."
            )
        else:
            errors.append(f"unexpected error probing reflection column: {exc.code} {body[:200]}")

    return errors


def fetch_live(env: dict[str, str], ids: list[str]) -> list[dict[str, Any]]:
    url = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("missing SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY")

    ids_filter = "in.(" + ",".join(ids) + ")"
    query = urllib.parse.urlencode({
        "select": "id,reflection",
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
    live_ids = {r["id"] for r in live}
    json_ids = {r["id"] for r in rows}

    missing = sorted(json_ids - live_ids)
    extra = sorted(live_ids - json_ids)
    if missing:
        errors.append(f"JSON has ids not in live published content: {missing}")
    if extra:
        errors.append(f"Live DB has ids not in JSON: {extra}")
    return errors


def write_rollback(meta: dict[str, Any], rows: list[dict[str, Any]],
                   live: list[dict[str, Any]], rollback_path: Path) -> None:
    by_id = {r["id"]: r for r in live}
    snapshot_rows = []
    for row in rows:
        live_row = by_id[row["id"]]
        snapshot_rows.append({
            "id": row["id"],
            "previous_reflection": live_row.get("reflection"),
        })
    snapshot = {
        "meta": {
            "label": meta["label"],
            "expected_count": meta["expected_count"],
        },
        "rows": snapshot_rows,
    }
    rollback_path.parent.mkdir(parents=True, exist_ok=True)
    rollback_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")


def default_rollback_path(input_path: Path) -> Path:
    stem = input_path.stem
    return input_path.with_name(f"{stem}-rollback.json")


def report(header: str, errors: list[str]) -> None:
    print(header, file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)


if __name__ == "__main__":
    sys.exit(main())
