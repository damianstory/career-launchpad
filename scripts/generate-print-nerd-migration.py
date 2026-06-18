#!/usr/bin/env python3
"""Generate the "Print Nerd" YouTube shorts content migration from committed JSON.

Source: scripts/data/print-nerd-videos.json (6 vertical YouTube shorts from the
@CanadianPrintScholarships "Sheila the Print Nerd" series).

Models scripts/generate-mindsets-gumlet-migration.py (full Learn More fields +
video_duration + idempotent upsert) but supports a per-row `categories` list so
each video can link to a primary + secondary path (multi-category linking, like
scripts/generate-skills-canada-migration.py). primaryCategory is computed in the
app by lowest display_order, so every row pins `emerging-careers` (order 1) as the
primary alongside an optional secondary.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


DATA_PATH = Path("scripts/data/print-nerd-videos.json")
DEFAULT_OUTPUT = Path("supabase/migrations/20260617120000_print_nerd_videos.sql")

PLAYLIST_URL = "https://www.youtube.com/@CanadianPrintScholarships/shorts"
EXPECTED_ROW_COUNT = 6
ID_PREFIX = "print-nerd"
PRIMARY_CATEGORY = "emerging-careers"

KNOWN_CATEGORY_SLUGS = {
    "emerging-careers",
    "on-the-job",
    "life-skills",
    "mindsets",
    "how-i-got-here",
    "problems-to-solve",
    "post-secondary",
    "job-board",
    "skills-canada",
}

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
    "categories",
    "youtube_id",
    "url",
    "orientation",
    "duration_seconds",
    "thumbnail_url",
)

# Reflection editorial rule (mirrors scripts/preflight-reflections.py).
WORD_MIN = 20
WORD_MAX = 50
SECOND_PERSON_RE = re.compile(r"\byou(?:r|rs|rself)?\b", re.IGNORECASE)
EM_DASH = "—"


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

    for field_name in ("content_id", "slug", "youtube_id", "url"):
        values = [row.get(field_name) for row in rows]
        duplicates = sorted({value for value, count in Counter(values).items() if count > 1})
        if duplicates:
            errors.append(f"duplicate {field_name} values: {duplicates}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_FIELDS if not row.get(field)]
        if missing:
            errors.append(f"row {index} missing required fields: {', '.join(missing)}")
            continue

        if row["orientation"] != "vertical":
            errors.append(f"row {index} has orientation {row['orientation']!r}, expected 'vertical'")

        if not isinstance(row["duration_seconds"], int) or row["duration_seconds"] <= 0:
            errors.append(f"row {index} has invalid duration_seconds: {row['duration_seconds']!r}")

        if len(row["title"]) > 100:
            errors.append(f"row {index} title exceeds content title limit: {len(row['title'])} chars")

        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", row["slug"]):
            errors.append(f"row {index} has invalid slug: {row['slug']!r}")

        youtube_id = row["youtube_id"]
        if youtube_id not in row["url"]:
            errors.append(f"row {index} url does not contain youtube_id {youtube_id!r}")

        expected_thumbs = {
            f"https://img.youtube.com/vi/{youtube_id}/maxresdefault.jpg",
            f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg",
        }
        if row["thumbnail_url"] not in expected_thumbs:
            errors.append(
                f"row {index} thumbnail_url is {row['thumbnail_url']!r}, expected one of {sorted(expected_thumbs)}"
            )

        errors.extend(validate_categories(index, row["categories"]))
        errors.extend(validate_editorial_rule(index, row["reflection"]))

    return errors


def validate_categories(index: int, categories: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(categories, list) or not categories:
        errors.append(f"row {index} categories must be a non-empty list")
        return errors
    if len(set(categories)) != len(categories):
        errors.append(f"row {index} has duplicate categories: {categories}")
    unknown = [slug for slug in categories if slug not in KNOWN_CATEGORY_SLUGS]
    if unknown:
        errors.append(f"row {index} has unknown category slugs: {unknown}")
    if PRIMARY_CATEGORY not in categories:
        errors.append(f"row {index} categories must include the primary {PRIMARY_CATEGORY!r}")
    return errors


def validate_editorial_rule(index: int, value: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(value, str) or not value.strip():
        errors.append(f"row {index} empty reflection")
        return errors

    text = value.strip()
    word_count = len(text.split())
    if word_count < WORD_MIN or word_count > WORD_MAX:
        errors.append(f"row {index} reflection has {word_count} words; expected {WORD_MIN}-{WORD_MAX}")
    if not SECOND_PERSON_RE.search(text):
        errors.append(f"row {index} reflection must use second-person ('you'/'your')")
    if not text.endswith("?"):
        errors.append(f"row {index} reflection must end with '?'")
    if EM_DASH in text:
        errors.append(f"row {index} reflection contains em-dash; use a comma or colon")
    return errors


def print_audit(rows: list[dict[str, Any]]) -> None:
    print(f"Source: {PLAYLIST_URL}")
    print(f"Row count: {len(rows)}")
    primary = Counter()
    secondary = Counter()
    total_links = 0
    for row in rows:
        cats = row.get("categories") or []
        total_links += len(cats)
        if cats:
            primary[PRIMARY_CATEGORY] += 1
            for slug in cats:
                if slug != PRIMARY_CATEGORY:
                    secondary[slug] += 1
    print(f"Primary (emerging-careers) videos: {primary[PRIMARY_CATEGORY]}")
    print(f"Secondary histogram: {dict(secondary)}")
    print(f"Total content_categories links: {total_links}")
    print(f"Orientation counts: {dict(Counter(row.get('orientation') for row in rows))}")
    durations = [row.get("duration_seconds", 0) for row in rows]
    if durations:
        print(f"Duration (s): min={min(durations)}, max={max(durations)}, sum={sum(durations)}")


def expected_link_count(rows: list[dict[str, Any]]) -> int:
    return sum(len(row["categories"]) for row in rows)


def used_category_slugs(rows: list[dict[str, Any]]) -> list[str]:
    slugs: list[str] = []
    for row in rows:
        for slug in row["categories"]:
            if slug not in slugs:
                slugs.append(slug)
    return slugs


def render_sql(rows: list[dict[str, Any]], source: Path) -> str:
    content_values = ",\n    ".join(render_content_value(row) for row in rows)
    content_ids = ", ".join(sql(row["content_id"]) for row in rows)
    category_values = ",\n    ".join(render_category_values(row) for row in rows)
    expected_categories = ",\n      ".join(f"({sql(slug)})" for slug in used_category_slugs(rows))
    expected_links = expected_link_count(rows)

    return f"""-- Seed "Print Nerd" YouTube shorts (Canadian Print Scholarships).
-- Source: {PLAYLIST_URL}
-- Generated by scripts/generate-print-nerd-migration.py from {source}.

do $$
declare
  expected_count int := {EXPECTED_ROW_COUNT};
  expected_links int := {expected_links};
  actual_count int;
  linked_count int;
  missing_categories text[];
begin
  select array_agg(expected.slug order by expected.slug)
    into missing_categories
  from (
    values
      {expected_categories}
  ) as expected(slug)
  left join public.categories categories on categories.slug = expected.slug
  where categories.id is null;

  if missing_categories is not null then
    raise exception 'Missing required categories: %', array_to_string(missing_categories, ', ');
  end if;

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
    raise exception 'Expected % print-nerd rows upserted, got %', expected_count, actual_count;
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
  where cc.content_id in ({content_ids});

  if linked_count <> expected_links then
    raise exception 'Expected % print-nerd category links, got %', expected_links, linked_count;
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


def render_category_values(row: dict[str, Any]) -> str:
    content_id = sql(row["content_id"])
    return ",\n    ".join(f"({content_id}, {sql(slug)})" for slug in row["categories"])


def sql(value: Any) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


if __name__ == "__main__":
    raise SystemExit(main())
