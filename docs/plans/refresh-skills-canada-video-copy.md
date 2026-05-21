# Refresh Skills Canada Video Copy — Implementation Plan

## Context

The 160 Skills Canada videos shipped with templated descriptions like
"Follow the path behind {title}..." and "Meet {title} through a quick career
snapshot...". They are functional but repetitive, and they have **no
takeaway** set — meaning the desktop "Why it matters" pull quote (at
`src/components/LaunchpadApp.tsx:1132`) and the Learn More "Key takeaway"
block (at `src/components/LearnMorePanel.tsx:209`) currently fall back to
the description or render nothing.

We just shipped the same kind of refresh for the 68 non-Skills-Canada videos
(commit `4bf69d0`). This plan applies the proven pattern to Skills Canada at
larger scale (160 rows) with category-specific framing.

Mirror the tooling pattern from the non-SC pass:

- Editorial JSON source of truth → preflight against live → SQL generator
  → idempotent UPDATE migration with row-count assertion → reuse existing
  `/api/revalidate-launchpad-content` route.

## Required decisions before coding

Open `AskUserQuestion` for these — don't assume:

1. **Description scope.** Two options:
   - **A (recommended): takeaways only.** Leave the 160 SC descriptions
     as they are. Add a new `takeaway` per row. Lowest editorial overhead.
   - **B: descriptions + takeaways.** Rewrite both for every row. More
     work but breaks the templated voice for good.
2. **Editorial owner.** Who drafts/reviews the 160 takeaways? Same
   blocking question as the non-SC pass.
3. **Pilot vs full batch.** 160 rows is 2.4x the non-SC pass. Reasonable
   options:
   - Pilot one small category first (e.g. `problems-to-solve` at 4 rows,
     or `life-skills` / `mindsets` at 8 each), get sign-off on tone, then
     do the rest in one or two follow-up PRs.
   - Or commit to all 160 in one PR if editorial bandwidth allows.

## Field semantics (same as non-SC pass)

- **description** = what the video shows (specific, scannable in feed).
  If we keep current descriptions, they already meet this bar — just
  templated.
- **takeaway** = why a student should care, or the career insight to
  carry forward. One sentence. Reads naturally under both UI labels:
  "Why it matters" (desktop pull quote) and "Key takeaway" (Learn More).
  See `pullQuoteFor()` at `LaunchpadApp.tsx:2622`.

## Per-category framing guidance

Skills Canada videos break down as:

| Category | Count | Takeaway angle |
|---|---|---|
| on-the-job | 61 | What the work feels like; what choices/habits matter; what students can notice about real workplaces. |
| emerging-careers | 27 | How the field connects to changing industries; what skills age well; what's becoming possible. |
| how-i-got-here | 25 | What the actual path looked like; the choices and chance encounters that shaped it. |
| post-secondary | 14 | What the training program is for; who it's a good fit for; what comes after. |
| job-board | 13 | What the role actually involves; how to evaluate fit before applying. |
| life-skills | 8 | A useful career skill outside any specific job; when and how to apply it. |
| mindsets | 8 | A reframe or habit that compounds over a career. |
| problems-to-solve | 4 | A real problem the field is working on; what kind of person works on it. |

These are starting angles, not templates. The takeaway must still be
specific to the video, not a category platitude.

## Scope

- **Edit:** 160 rows where `id LIKE 'skills-canada-%'` and
  `content_type = 'video'` in `public.content`.
- **Do not edit:** the 68 non-SC videos refreshed in commit `4bf69d0`,
  any articles, any playbooks.

## Workflow

### Step 1 — Editorial source

Two valid shapes for the source of truth (pick when starting):

- **Option α:** Edit `scripts/data/skills-canada-videos.json` directly —
  this is the canonical SC source. Add `new_takeaway` (and optionally
  `new_description`) fields per row, leaving the existing fields
  untouched. Lets the migration generator read from one file.
- **Option β:** Mirror the non-SC pattern — new file at
  `scripts/data/copy-updates/skills-canada-video-copy-update.json` with
  `slug`, `category`, `title`, `old_description`, `new_description`
  (optional), `new_takeaway`. Keeps the seed source clean.

Option β is recommended — same shape as the non-SC PR, reviewable as a
standalone diff, doesn't muddy the seed source.

### Step 2 — Preflight + rollback script

`scripts/preflight-skills-canada-video-copy.py`. Same shape as
`scripts/preflight-non-skills-video-copy.py`. Differences:

- `EXPECTED_ROW_COUNT = 160`
- `EXPECTED_HISTOGRAM = {"on-the-job": 61, "emerging-careers": 27,
  "how-i-got-here": 25, "post-secondary": 14, "job-board": 13,
  "life-skills": 8, "mindsets": 8, "problems-to-solve": 4}`
- Fetch filter: `id=like.skills-canada-*` (positive filter this time).
- Rollback snapshot at
  `scripts/data/copy-updates/skills-canada-video-copy-rollback.json`.
- Schema check still applies (confirms takeaway column exists; should
  pass — it does in production as of 2026-05-12 evening).

### Step 3 — SQL generator

`scripts/generate-skills-canada-copy-migration.py`. Same shape as
`scripts/generate-non-skills-copy-migration.py`. Differences:

- Expects 160 rows.
- Targets by **id** (e.g. `skills-canada-001`), not slug — SC rows have
  stable text ids assigned in their seed migration; using id is cheaper
  to verify than slug because ids are unique by design.
- WHERE clause: `c.id = v.id AND c.content_type = 'video' AND c.id like
  'skills-canada-%'` (positive filter as belt-and-suspenders).
- If Option α was chosen for editorial source, generator reads
  `scripts/data/skills-canada-videos.json` and picks `new_takeaway` per
  row. Skip rows without one (or fail — pick a policy upfront).

### Step 4 — Migration

`supabase/migrations/<timestamp>_refresh_skills_canada_video_copy.sql`.
Same DO-block shape as
`supabase/migrations/20260512222320_refresh_non_skills_video_copy.sql`,
but:

- `expected_count int := 160` (or whatever the batch size is for a
  pilot).
- VALUES table keyed by id.
- Description column update only if Option B was chosen for scope;
  otherwise just `set takeaway = v.new_takeaway`.

### Step 5 — Apply + revalidate

1. Run preflight locally → expect pass + rollback snapshot written.
2. Apply migration via Supabase SQL editor (paste contents) or
   `supabase db push`.
3. Hit the existing revalidation route:
   ```
   curl -X POST -H "Authorization: Bearer $LAUNCHPAD_REVALIDATE_SECRET" \
     https://<env>/api/revalidate-launchpad-content
   ```
   Note: `LAUNCHPAD_REVALIDATE_SECRET` is **not yet set in Vercel** as
   of 2026-05-12. If the user hasn't set it by the time you reach this
   step, either ask them to set it or push a no-op commit to trigger a
   redeploy (which clears cache as a side effect).
4. Spot-check 3 rows per category in the live app.

## Verification

**Automated:**
- `npx tsc --noEmit`, `npm run lint`, `npm run test` all pass.
- Preflight prints `preflight OK; wrote scripts/data/copy-updates/skills-canada-video-copy-rollback.json`
  and exits 0.

**Post-apply SQL spot-check (Supabase SQL editor):**

```sql
-- Should match the batch size (160 if full, else pilot size).
select count(*) from public.content
where id like 'skills-canada-%' and content_type = 'video'
  and takeaway is not null;

-- Confirm non-SC rows untouched: 68 should still have takeaways.
select count(*) from public.content
where id not like 'skills-canada-%' and content_type = 'video'
  and takeaway is not null;

-- Sample per category.
select id, slug, takeaway
from public.content
where id in ('skills-canada-001', 'skills-canada-100', 'skills-canada-160')
order by id;
```

## Files referenced

- Existing tooling to mirror:
  - `scripts/preflight-non-skills-video-copy.py`
  - `scripts/generate-non-skills-copy-migration.py`
  - `supabase/migrations/20260512222320_refresh_non_skills_video_copy.sql`
  - `src/app/api/revalidate-launchpad-content/route.ts` (reused as-is)
- Canonical SC seed source: `scripts/data/skills-canada-videos.json`
- Reference for category histogram + slug list:
  - `supabase/migrations/20260512204500_skills_canada_videos.sql`
- UI surfaces the new takeaway hits:
  - `src/components/LaunchpadApp.tsx:1132` (desktop "Why it matters")
  - `src/components/LaunchpadApp.tsx:2622` (`pullQuoteFor()` helper)
  - `src/components/LearnMorePanel.tsx:209` (Learn More "Key takeaway")

## Risk register

- **160 rows is a lot of editorial work.** If the agent drafting is
  Claude, plan for at least one full session purely on copy. The
  non-SC pass (68 rows) used roughly half the Erin/Max/Cleo session.
  Pilot one category first to calibrate tone before going wide.
- **Templated voice slip.** The current SC descriptions are templated;
  it'll be tempting to fall into the same trap with takeaways. Per-
  category framing above is the antidote — every takeaway should be
  defensibly specific to the row.
- **id-based update reliability.** SC rows use stable text ids assigned
  at seed time. If anything in the live DB has renamed/deleted these,
  the preflight diff will catch it.
- **Production drift between preflight and apply.** Same as non-SC pass
  — re-run the preflight immediately before applying the SQL.
- **`LAUNCHPAD_REVALIDATE_SECRET` not yet set.** Worth checking with
  the user early; saves backtracking at step 5.

## Out of scope for this pass

- Touching `why_it_matters` or `planning_connection` columns. They
  exist in the schema but aren't rendered anywhere as of this writing.
- Re-running the seed migration. That migration is already applied;
  this pass updates live rows directly.
- Any non-SC content (videos, articles, playbooks).

## How a fresh session should start

When you're handed this plan in a new context window, do the following
in order:

1. Read `commit 4bf69d0` and the files it touches to understand the
   non-SC pattern that this plan mirrors.
2. Use `AskUserQuestion` to settle the three open decisions
   (description scope, editorial owner, pilot vs full batch).
3. Confirm the production state once with a quick PostgREST query to
   `?select=id&id=like.skills-canada-*` and `?takeaway=not.is.null`,
   so you have a fresh baseline before doing anything.
4. Mirror the non-SC files into SC equivalents per Steps 1–4 above.
5. Run preflight + generator, then ExitPlanMode for approval.
