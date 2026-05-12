#!/usr/bin/env python3
"""Generate the Skills Canada content migration from the committed JSON data."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


DATA_PATH = Path("scripts/data/skills-canada-videos.json")
DEFAULT_OUTPUT = Path("supabase/migrations/20260512204500_skills_canada_videos.sql")

EVENT_SLUG = "skills-canada"
EXPECTED_ROW_COUNT = 160
EXPECTED_HISTOGRAM = {
    "on-the-job": 61,
    "emerging-careers": 27,
    "how-i-got-here": 25,
    "post-secondary": 14,
    "job-board": 13,
    "mindsets": 8,
    "life-skills": 8,
    "problems-to-solve": 4,
}
LABEL_TO_SLUG = {
    "On the Job": "on-the-job",
    "Emerging Careers": "emerging-careers",
    "How I Got Here": "how-i-got-here",
    "Post-Secondary": "post-secondary",
    "Job Board": "job-board",
    "Mindsets": "mindsets",
    "Life Skills": "life-skills",
    "Problems to Solve": "problems-to-solve",
}
REQUIRED_FIELDS = ("title_clean", "url", "permanent_category", "youtube_id")


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
    args.output.write_text(render_sql(rows))
    print(f"\nWrote {args.output}")
    return 0


def validate_rows(rows: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []

    if len(rows) != EXPECTED_ROW_COUNT:
        errors.append(f"row count is {len(rows)}, expected {EXPECTED_ROW_COUNT}")

    histogram = Counter(row.get("permanent_category") for row in rows)
    if dict(histogram) != EXPECTED_HISTOGRAM:
        errors.append(f"category histogram is {dict(histogram)}, expected {EXPECTED_HISTOGRAM}")

    for index, row in enumerate(rows, start=1):
        missing = [field for field in REQUIRED_FIELDS if not row.get(field)]
        if missing:
            errors.append(f"row {index} missing required fields: {', '.join(missing)}")

        sheet_category = row.get("sheet_category")
        mapped_slug = LABEL_TO_SLUG.get(sheet_category)
        if mapped_slug is None:
            errors.append(f"row {index} has unmapped sheet category: {sheet_category!r}")
        elif mapped_slug != row.get("permanent_category"):
            errors.append(
                f"row {index} maps {sheet_category!r} to {mapped_slug!r}, "
                f"but JSON has {row.get('permanent_category')!r}"
            )

    slugs = [row.get("slug") for row in rows]
    duplicate_slugs = [slug for slug, count in Counter(slugs).items() if count > 1]
    if duplicate_slugs:
        errors.append(f"duplicate final slugs: {duplicate_slugs}")

    content_ids = [row.get("content_id") for row in rows]
    expected_ids = [f"skills-canada-{index:03d}" for index in range(1, EXPECTED_ROW_COUNT + 1)]
    if content_ids != expected_ids:
        errors.append("content_id sequence does not match skills-canada-001..160")

    return errors


def print_audit(rows: list[dict[str, Any]]) -> None:
    print(f"Row count: {len(rows)}")
    print("Category histogram:")
    histogram = Counter(row["permanent_category"] for row in rows)
    for slug, expected in EXPECTED_HISTOGRAM.items():
        print(f"  {slug}: {histogram.get(slug, 0)} (expected {expected})")

    missing_required = [
        row["sequence"]
        for row in rows
        if any(not row.get(field) for field in REQUIRED_FIELDS)
    ]
    print(f"Rows missing required fields: {missing_required or 'none'}")

    base_slug_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        base_slug_groups[strip_duplicate_suffix(row["slug"])].append(row)
    duplicate_groups = [group for group in base_slug_groups.values() if len(group) > 1]
    print(f"Duplicate slug bases: {len(duplicate_groups)}")
    for group in duplicate_groups:
        values = ", ".join(f"{row['sheet_row']}->{row['slug']}" for row in group)
        print(f"  {values}")

    truncations = [
        row
        for row in rows
        if row["title_clean"] != cleaned_without_truncation(row["title_original"])
    ]
    print(f"Title truncations: {len(truncations)}")
    for row in truncations:
        print(f"  row {row['sheet_row']}: {row['title_clean']}")

    null_careers = [row["sheet_row"] for row in rows if row.get("career") is None]
    print(f"Null careers: {len(null_careers)} rows")
    print(f"  {null_careers}")

    print(f"Orientation counts: {dict(Counter(row['orientation'] for row in rows))}")

    fallbacks = [row for row in rows if row["thumbnail_url"].endswith("/hqdefault.jpg")]
    print(f"Thumbnail fallbacks: {len(fallbacks)}")
    for row in fallbacks:
        print(f"  row {row['sheet_row']}: {row['youtube_id']} -> hqdefault.jpg")


def cleaned_without_truncation(title: str) -> str:
    title = re.sub(r"\s*-\s*YouTube\s*$", "", title).strip()
    title = re.sub(r"^(?:#\S+\s*)+", "", title).strip()
    title = re.sub(r"(?:\s+#\S+)+$", "", title).strip()
    return title


def strip_duplicate_suffix(slug: str) -> str:
    return re.sub(r"-[2-9][0-9]*$", "", slug)


def render_sql(rows: list[dict[str, Any]]) -> str:
    content_values = ",\n    ".join(render_content_value(row) for row in rows)
    category_values = ",\n    ".join(render_category_values(row) for row in rows)

    return f"""-- Seed Skills Canada event videos.
-- Generated by scripts/generate-skills-canada-migration.py from {DATA_PATH}.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'content'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    alter table public.content_categories drop constraint if exists content_categories_content_id_fkey;
    alter table public.analytics_events drop constraint if exists analytics_events_content_id_fkey;
    alter table public.content drop constraint if exists content_related_playbook_id_fkey;

    alter table public.content alter column id drop default;
    alter table public.content alter column id type text using id::text;
    alter table public.content alter column related_playbook_id type text using related_playbook_id::text;
    alter table public.content_categories alter column content_id type text using content_id::text;
    alter table public.analytics_events alter column content_id type text using content_id::text;

    alter table public.content_categories
      add constraint content_categories_content_id_fkey
      foreign key (content_id) references public.content(id) on delete cascade;

    alter table public.analytics_events
      add constraint analytics_events_content_id_fkey
      foreign key (content_id) references public.content(id);

    alter table public.content
      add constraint content_related_playbook_id_fkey
      foreign key (related_playbook_id) references public.content(id);
  end if;

  if exists (select 1 from public.categories where slug = 'day-in-the-life')
     and not exists (select 1 from public.categories where slug = 'on-the-job') then
    update public.categories
    set slug = 'on-the-job',
        name = 'On the Job'
    where slug = 'day-in-the-life';
  end if;
end $$;

do $$
declare
  missing_categories text[];
begin
  insert into public.categories (slug, name, icon, display_order)
  values ('{EVENT_SLUG}', 'Skills Canada', 'Trophy', 0)
  on conflict (slug) do update
    set name = excluded.name,
        icon = excluded.icon,
        display_order = excluded.display_order;

  select array_agg(expected.slug order by expected.slug)
    into missing_categories
  from (
    values
      ('{EVENT_SLUG}'),
      ('on-the-job'),
      ('emerging-careers'),
      ('life-skills'),
      ('mindsets'),
      ('how-i-got-here'),
      ('problems-to-solve'),
      ('post-secondary'),
      ('job-board')
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
    published_at,
    is_published
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
        published_at = excluded.published_at,
        is_published = excluded.is_published,
        updated_at = now();

  insert into public.content_categories (content_id, category_id)
  select links.content_id, categories.id
  from (
    values
    {category_values}
  ) as links(content_id, category_slug)
  join public.categories categories on categories.slug = links.category_slug
  on conflict (content_id, category_id) do nothing;
end $$;
"""


def render_content_value(row: dict[str, Any]) -> str:
    return (
        f"({sql(row['content_id'])}, {sql(row['slug'])}, {sql(row['title_clean'])}, "
        f"{sql(row['description'])}, 'video', {sql(row['thumbnail_url'])}, "
        f"{sql(row['url'])}, {sql(row['orientation'])}, "
        f"now() - ({int(row['sequence'])} * interval '1 second'), true)"
    )


def render_category_values(row: dict[str, Any]) -> str:
    content_id = sql(row["content_id"])
    permanent = sql(row["permanent_category"])
    event = sql(EVENT_SLUG)
    return f"({content_id}, {permanent}),\n    ({content_id}, {event})"


def sql(value: Any) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


if __name__ == "__main__":
    raise SystemExit(main())
