-- Retire the 'job-board' category.
-- 1) Reassign its 13 Skills Canada videos (11 -> on-the-job, 2 -> emerging-careers).
-- 2) Delete the 3 stale sample articles from historical migration 008 and their
--    analytics events (FK does not cascade). Confirmed by Damian 2026-08-05:
--    these articles were placeholder seed data; their events are noise.
-- 3) Delete the category row.
-- Safe to re-run. Rollback: scripts/data/rollbacks/retire_job_board_category_rollback.sql
-- (PARTIAL: stale articles/events are not restored).

do $$
declare
  jb_id uuid;
  bad text[];
  removed int;
  stale_events int;
  stale_articles int;
begin
  create temp table jb_reassign (content_id text primary key, target_slug text not null)
    on commit drop;
  insert into jb_reassign (content_id, target_slug) values
    ('skills-canada-094', 'on-the-job'),
    ('skills-canada-095', 'emerging-careers'),
    ('skills-canada-110', 'on-the-job'),
    ('skills-canada-112', 'on-the-job'),
    ('skills-canada-123', 'on-the-job'),
    ('skills-canada-126', 'on-the-job'),
    ('skills-canada-135', 'emerging-careers'),
    ('skills-canada-139', 'on-the-job'),
    ('skills-canada-141', 'on-the-job'),
    ('skills-canada-145', 'on-the-job'),
    ('skills-canada-147', 'on-the-job'),
    ('skills-canada-152', 'on-the-job'),
    ('skills-canada-155', 'on-the-job');

  if (select count(*) from public.categories
      where slug in ('on-the-job', 'emerging-careers')) <> 2 then
    raise exception 'target categories missing';
  end if;

  select id into jb_id from public.categories where slug = 'job-board';

  if jb_id is not null then
    -- Exact pre-state: each of the 13 must have EXACTLY {job-board, skills-canada}.
    -- (Also guarantees no pre-existing target link, so the rollback's link
    -- deletions only ever remove links this migration created.)
    select array_agg(r.content_id order by r.content_id) into bad
    from jb_reassign r
    where coalesce((
      select array_agg(c.slug order by c.slug)
      from public.content_categories cc
      join public.categories c on c.id = cc.category_id
      where cc.content_id = r.content_id
    ), '{}') <> array['job-board', 'skills-canada'];
    if bad is not null then
      raise exception 'unexpected pre-state tag sets for: %', array_to_string(bad, ', ');
    end if;

    -- Insert target links, then drop the job-board links.
    insert into public.content_categories (content_id, category_id)
    select r.content_id, c.id
    from jb_reassign r
    join public.categories c on c.slug = r.target_slug
    on conflict (content_id, category_id) do nothing;

    delete from public.content_categories cc
    using jb_reassign r
    where cc.content_id = r.content_id and cc.category_id = jb_id;
    get diagnostics removed = row_count;
    if removed <> 13 then
      raise exception 'expected to remove 13 job-board links, removed %', removed;
    end if;
  else
    raise notice 'job-board category already absent';
  end if;

  -- Stale sample articles: BOTH branches, allowlisted slugs only.
  -- Events first (FK does not cascade). Deletion of events confirmed by Damian.
  delete from public.analytics_events
  where content_id in (
    select id from public.content
    where slug in ('wellcome-senior-research-manager-vaccines',
                   'coefficient-giving-role',
                   'rand-ai-biosecurity-research-resident')
  );
  get diagnostics stale_events = row_count;
  raise notice 'Deleted % analytics event(s) for stale job-board articles', stale_events;

  delete from public.content
  where slug in ('wellcome-senior-research-manager-vaccines',
                 'coefficient-giving-role',
                 'rand-ai-biosecurity-research-resident');
  get diagnostics stale_articles = row_count;
  raise notice 'Deleted % stale job-board article(s) (0-3 acceptable)', stale_articles;

  if jb_id is not null then
    -- Nothing may still reference job-board.
    select array_agg(content_id order by content_id) into bad
    from public.content_categories where category_id = jb_id;
    if bad is not null then
      raise exception 'job-board still has associations: %', array_to_string(bad, ', ');
    end if;

    delete from public.categories where id = jb_id;
    raise notice 'job-board category removed';
  end if;

  -- Terminal-state assertions (always run; guard against a prior accidental
  -- cascade delete masquerading as "already done").
  -- Each of the 13 must have EXACTLY {its target, skills-canada}.
  select array_agg(r.content_id order by r.content_id) into bad
  from jb_reassign r
  where coalesce((
    select array_agg(c.slug order by c.slug)
    from public.content_categories cc
    join public.categories c on c.id = cc.category_id
    where cc.content_id = r.content_id
  ), '{}') is distinct from (
    select array_agg(x order by x) from unnest(array[r.target_slug, 'skills-canada']) as x
  );
  if bad is not null then
    raise exception 'wrong final tag set for: %', array_to_string(bad, ', ');
  end if;

  if exists (select 1 from public.categories where slug = 'job-board') then
    raise exception 'job-board category still present';
  end if;

  if exists (
    select 1 from public.content
    where slug in ('wellcome-senior-research-manager-vaccines',
                   'coefficient-giving-role',
                   'rand-ai-biosecurity-research-resident')
  ) then
    raise exception 'stale job-board articles still present';
  end if;
end $$;
