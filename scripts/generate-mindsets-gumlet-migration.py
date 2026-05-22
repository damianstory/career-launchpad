#!/usr/bin/env python3
"""Generate the mindsets Gumlet video content migration from committed JSON."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


DATA_PATH = Path("scripts/data/mindsets-gumlet-videos.json")
DEFAULT_OUTPUT = Path("supabase/migrations/20260522000000_mindsets_gumlet_videos.sql")

EXPECTED_ROW_COUNT = 21
EXPECTED_CATEGORY = "mindsets"
ID_PREFIX = "mindsets-gumlet"
TEST_ROW_ID = "gumlet-bend-the-world-test"

REQUIRED_FIELDS = (
    "sequence",
    "content_id",
    "slug",
    "title",
    "description",
    "why_it_matters",
    "planning_connection",
    "takeaway",
    "reflection",
    "category",
    "gumlet_id",
    "url",
    "orientation",
    "duration_seconds",
    "thumbnail_url",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    rows = json.loads(args.data.read_text())
    errors = validate_rows(rows)
    print_audit(rows)

    if errors:
        print("\nRefusing to write SQL:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_sql(rows, args.data))
    print(f"\nWrote {args.output}")
    return 0


def validate_rows(rows: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []

    if len(rows) != EXPECTED_ROW_COUNT:
        errors.append(f"row count is {len(rows)}, expected {EXPECTED_ROW_COUNT}")

    sequences = [row.get("sequence") for row in rows]
    expected_sequences = list(range(1, EXPECTED_ROW_COUNT + 1))
    if sequences != expected_sequences:
        errors.append(f"sequence values are {sequences}, expected {expected_sequences}")

    content_ids = [row.get("content_id") for row in rows]
    expected_ids = [f"{ID_PREFIX}-{index:03d}" for index in expected_sequences]
    if content_ids != expected_ids:
        errors.append(f"content_id sequence is {content_ids}, expected {expected_ids}")

    for field_name in ("content_id", "slug", "gumlet_id", "url"):
        values = [row.get(field_name) for row in rows]
        duplicates = sorted({value for value, count in Counter(values).items() if count > 1})
        if duplicates:
            errors.append(f"duplicate {field_name} values: {duplicates}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_FIELDS if not row.get(field)]
        if missing:
            errors.append(f"row {index} missing required fields: {', '.join(missing)}")
            continue

        if row["category"] != EXPECTED_CATEGORY:
            errors.append(
                f"row {index} has category {row['category']!r}, expected {EXPECTED_CATEGORY!r}"
            )

        if row["orientation"] not in ("vertical", "horizontal"):
            errors.append(f"row {index} has invalid orientation: {row['orientation']!r}")

        if not isinstance(row["duration_seconds"], int) or row["duration_seconds"] <= 0:
            errors.append(
                f"row {index} has invalid duration_seconds: {row['duration_seconds']!r}"
            )

        if len(row["title"]) > 100:
            errors.append(
                f"row {index} title exceeds content title limit: {len(row['title'])} chars"
            )

        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", row["slug"]):
            errors.append(f"row {index} has invalid slug: {row['slug']!r}")

        gumlet_id = row["gumlet_id"]
        if not re.fullmatch(r"[0-9a-f]{24}", gumlet_id):
            errors.append(f"row {index} has invalid gumlet_id: {gumlet_id!r}")

        expected_embed_prefix = f"https://play.gumlet.io/embed/{gumlet_id}"
        if not row["url"].startswith(expected_embed_prefix):
            errors.append(
                f"row {index} url must start with {expected_embed_prefix!r}, got {row['url']!r}"
            )

        if gumlet_id not in row["thumbnail_url"]:
            errors.append(
                f"row {index} thumbnail_url does not reference gumlet_id {gumlet_id!r}"
            )

        if not row["reflection"].strip():
            errors.append(f"row {index} has blank reflection")


    return errors


def print_audit(rows: list[dict[str, Any]]) -> None:
    print(f"Row count: {len(rows)}")
    print(f"Category histogram: {dict(Counter(row.get('category') for row in rows))}")
    print(f"Orientation counts: {dict(Counter(row.get('orientation') for row in rows))}")
    durations = [row.get("duration_seconds", 0) for row in rows]
    if durations:
        print(
            f"Duration (s): min={min(durations)}, max={max(durations)}, "
            f"sum={sum(durations)}"
        )


def render_sql(rows: list[dict[str, Any]], source: Path) -> str:
    content_values = ",\n    ".join(render_content_value(row) for row in rows)
    content_ids = ", ".join(sql(row["content_id"]) for row in rows)
    category_values = ",\n    ".join(render_category_value(row) for row in rows)

    return f"""-- Seed mindset path Gumlet-hosted videos.
-- Source: scripts/data/mindsets-gumlet-videos.json
-- Generated by scripts/generate-mindsets-gumlet-migration.py from {source}.
-- Removes the temporary {TEST_ROW_ID!r} row (if any) before the upsert.

do $$
declare
  expected_count int := {EXPECTED_ROW_COUNT};
  actual_count int;
  linked_count int;
begin
  if not exists (select 1 from public.categories where slug = '{EXPECTED_CATEGORY}') then
    raise exception 'Missing required category: {EXPECTED_CATEGORY}';
  end if;

  delete from public.content
   where id = '{TEST_ROW_ID}'
     and id <> all (array[{content_ids}]);

  insert into public.content (
    id,
    slug,
    title,
    description,
    content_type,
    thumbnail_url,
    video_url,
    video_orientation,
    video_duration,
    published_at,
    is_published,
    why_it_matters,
    planning_connection,
    takeaway,
    reflection
  )
  values
    {content_values}
  on conflict (id) do update
    set slug = excluded.slug,
        title = excluded.title,
        description = excluded.description,
        content_type = excluded.content_type,
        thumbnail_url = excluded.thumbnail_url,
        video_url = excluded.video_url,
        video_orientation = excluded.video_orientation,
        video_duration = excluded.video_duration,
        published_at = excluded.published_at,
        is_published = excluded.is_published,
        why_it_matters = excluded.why_it_matters,
        planning_connection = excluded.planning_connection,
        takeaway = excluded.takeaway,
        reflection = excluded.reflection,
        updated_at = now();

  get diagnostics actual_count = row_count;
  if actual_count <> expected_count then
    raise exception 'Expected % mindset gumlet rows upserted, got %', expected_count, actual_count;
  end if;

  insert into public.content_categories (content_id, category_id)
  select links.content_id, categories.id
  from (
    values
    {category_values}
  ) as links(content_id, category_slug)
  join public.categories categories on categories.slug = links.category_slug
  on conflict (content_id, category_id) do nothing;

  select count(*)
    into linked_count
  from public.content_categories cc
  join public.categories c on c.id = cc.category_id
  where cc.content_id in ({content_ids})
    and c.slug = '{EXPECTED_CATEGORY}';

  if linked_count <> expected_count then
    raise exception 'Expected % mindset gumlet category links, got %', expected_count, linked_count;
  end if;
end $$;
"""


def render_content_value(row: dict[str, Any]) -> str:
    return (
        f"({sql(row['content_id'])}, {sql(row['slug'])}, {sql(row['title'])}, "
        f"{sql(row['description'])}, 'video', {sql(row['thumbnail_url'])}, "
        f"{sql(row['url'])}, {sql(row['orientation'])}, {int(row['duration_seconds'])}, "
        f"now() - ({int(row['sequence'])} * interval '1 second'), true, "
        f"{sql(row['why_it_matters'])}, {sql(row['planning_connection'])}, "
        f"{sql(row['takeaway'])}, {sql(row['reflection'])})"
    )


def render_category_value(row: dict[str, Any]) -> str:
    return f"({sql(row['content_id'])}, {sql(row['category'])})"


def sql(value: Any) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


if __name__ == "__main__":
    raise SystemExit(main())
