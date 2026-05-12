#!/usr/bin/env python3
"""Generate a Skills Canada video takeaway refresh migration for one batch.

Reads `scripts/data/copy-updates/skills-canada-<batch>-copy-update.json`,
validates shape constraints (same as the preflight), and emits a single
UPDATE migration with a row-count assertion. Does not contact Supabase;
run the preflight first if you want live-DB verification.

Targets rows by stable `skills-canada-NNN` id, not slug. Updates only the
`takeaway` column — descriptions are intentionally left untouched.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


COPY_UPDATES_DIR = Path("scripts/data/copy-updates")
MIGRATIONS_DIR = Path("supabase/migrations")
REQUIRED_ROW_FIELDS = ("id", "slug", "category", "title",
                      "old_description", "new_takeaway")
REQUIRED_META_FIELDS = ("batch", "expected_count", "expected_histogram")
ID_PREFIX = "skills-canada-"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", required=True,
                        help="Batch name, e.g. life-skills, problems-to-solve")
    parser.add_argument("--output", type=Path, default=None,
                        help="Output SQL path (default: timestamped file under supabase/migrations)")
    args = parser.parse_args()

    data_path = COPY_UPDATES_DIR / f"skills-canada-{args.batch}-copy-update.json"
    if not data_path.exists():
        print(f"Editorial JSON not found: {data_path}", file=sys.stderr)
        return 1

    data = json.loads(data_path.read_text())
    errors = validate(data, args.batch)
    if errors:
        print("Refusing to write SQL:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    output = args.output or default_output_path(args.batch)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_sql(data, data_path))
    print(f"Wrote {output}")
    return 0


def validate(data: Any, expected_batch: str) -> list[str]:
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

    rows = data["rows"]
    expected_count = meta["expected_count"]
    expected_histogram = meta["expected_histogram"]

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


def default_output_path(batch: str) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    safe = batch.replace("-", "_")
    return MIGRATIONS_DIR / f"{stamp}_refresh_skills_canada_{safe}_video_copy.sql"


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def render_value_row(row: dict[str, Any]) -> str:
    return f"      ({quote(row['id'])}, {quote(row['new_takeaway'])})"


def render_sql(data: dict[str, Any], source: Path) -> str:
    meta = data["meta"]
    rows = data["rows"]
    expected_count = meta["expected_count"]
    batch = meta["batch"]
    values_block = ",\n".join(render_value_row(row) for row in rows)
    return f"""-- Refresh takeaway for the {expected_count} {batch} Skills Canada videos.
-- Generated by scripts/generate-skills-canada-copy.py from {source}.
-- Targets rows by stable id; descriptions are intentionally left untouched.
-- Fails the transaction if the expected number of rows is not updated.

do $$
declare
  expected_count int := {expected_count};
  actual_count int;
begin
  with v(id, new_takeaway) as (values
{values_block}
  )
  update public.content c
  set takeaway = v.new_takeaway
  from v
  where c.id = v.id
    and c.content_type = 'video'
    and c.id like 'skills-canada-%';

  get diagnostics actual_count = row_count;
  if actual_count <> expected_count then
    raise exception 'Expected % rows updated, got %', expected_count, actual_count;
  end if;
end $$;
"""


if __name__ == "__main__":
    sys.exit(main())
