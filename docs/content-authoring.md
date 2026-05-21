# Content authoring — reflections

Every piece of Learn More content (video or article) on Career LaunchPAD ships with a **Reflection** prompt. The reflection appears below the Key Takeaway inside the Learn More modal and asks the student to apply what they just consumed to their own "life after high school" decisions.

Reflection is a required column on `public.content`: `NOT NULL` plus a `CHECK (length(trim(reflection)) > 0)` constraint. Any new content row that lacks one will fail to insert.

## Editorial rule

**Scaffolded prompt.** Two parts in one short paragraph: (1) a framing sentence that names the tension or context the content surfaced, and (2) an open question tied to the student's own life-after-high-school decisions. 20–50 words. Second-person ("you / your" must appear). Ends with a question mark. No em-dashes. No journaling commands ("write down…", "list three…") unless the batch is intentionally action-oriented.

Anchor the question in *choice, exploration, skill, path, experiment,* or *next step*.

### Good examples (✅)

1. *Schools and workplaces are both figuring out where AI fits. As you think about your next step after high school, where do you want to be the one doing the thinking, and where would you welcome a tool to help?*
   42 words. Framing names the AI/work tension; question pivots to student's own role.
2. *Most adults you know did not follow their original plan. When you imagine your own next five years, does it feel safer to pick one path now, or to design your first experiment?*
   33 words. Framing normalises non-linear paths; question forces the student to pick a stance.
3. *Plans change, but skills travel. As you think about life after high school, which skill on this list do you feel you already have, and which one do you want to grow on purpose?*
   34 words. Framing teases the takeaway; question makes it concrete.

### Bad examples (❌)

1. *Reflect on the video.*
   4 words. Closed. No framing, no anchor.
2. *Write down three things you learned, then list two skills you want to develop, and finally describe a goal for next year.*
   A journaling command stacked into one sentence. Not a question; not scaffolded.
3. *What did you think about the video?*
   8 words. No framing, no anchor, generic. Fails the editorial rule even if it ends in a question mark.

## Pipeline

Reflections are authored as JSON, validated against the live DB, then applied via a generated SQL migration.

```bash
# 1. Author scripts/data/reflections/<label>.json (see shape below).
# 2. Preflight against live Supabase (writes a rollback snapshot).
python scripts/preflight-reflections.py \
  --input scripts/data/reflections/<label>.json

# 3. Generate the UPDATE migration.
python scripts/generate-reflections-migration.py \
  --input scripts/data/reflections/<label>.json
#   → writes supabase/migrations/<ts>_reflection_<label>.sql

# 4. Review the SQL, apply via Supabase.
# 5. Re-run the audit query (see below) to confirm missing_reflection = 0
#    for the batch's slice.
```

### JSON shape

```json
{
  "meta": {
    "label": "skills-canada-life-skills",
    "expected_count": 8
  },
  "rows": [
    { "id": "skills-canada-NNN", "reflection": "..." }
  ]
}
```

`meta.expected_count` must match `len(rows)` and the live count for the targeted ids. The preflight enforces the editorial rule (word count, second-person, ends with `?`, no em-dash) and the schema check (the `reflection` column must exist on `public.content`).

## Audit SQL

After PR 1 ships and the `reflection` column exists:

```sql
select content_type,
       count(*) as total_published,
       count(*) filter (where reflection is null or reflection = '') as missing_reflection
from content
where is_published = true
group by content_type
order by content_type;
```

## Adding new content (LTC, future imports)

New content generators (`scripts/generate-long-term-care-migration.py` and any future equivalents) require `reflection` as a non-optional field on every row in their source JSON. Imports without reflection are refused at generate-time. Reflection is included in the `INSERT … ON CONFLICT DO UPDATE` clause so re-runs of the same source data keep the reflection column in sync.
