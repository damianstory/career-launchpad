-- Rollback for supabase/migrations/20260805062954_retire_job_board_category.sql.
-- PARTIAL data rollback: the 3 stale sample articles and their analytics events
-- are intentionally NOT restored.
--
-- Operational order: deploy the previous code FIRST (the retired-state DB is
-- compatible with old code), then run this SQL, then revalidate the content
-- cache. Running this SQL before the code rollback creates the known bad state:
-- restored job-board data with code that filters job-board out.
--
-- Safe to re-run. Link deletions below only remove links the forward migration
-- created: its exact pre-state assertion proved no target link pre-existed.

do $$
declare
  jb_id uuid;
  bad text[];
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

  -- Re-create the category, correcting any malformed existing row.
  insert into public.categories (slug, name, icon, display_order)
  values ('job-board', 'Job Board', 'Newspaper', 8)
  on conflict (slug) do update
    set name = excluded.name,
        icon = excluded.icon,
        display_order = excluded.display_order;

  select id into jb_id from public.categories where slug = 'job-board';

  -- Re-link the 13 videos to job-board.
  insert into public.content_categories (content_id, category_id)
  select r.content_id, jb_id
  from jb_reassign r
  on conflict (content_id, category_id) do nothing;

  -- Remove the topical links the forward migration added.
  delete from public.content_categories cc
  using jb_reassign r, public.categories c
  where cc.content_id = r.content_id
    and cc.category_id = c.id
    and c.slug = r.target_slug;

  -- Assert each of the 13 is back to exactly {job-board, skills-canada}.
  select array_agg(r.content_id order by r.content_id) into bad
  from jb_reassign r
  where coalesce((
    select array_agg(c.slug order by c.slug)
    from public.content_categories cc
    join public.categories c on c.id = cc.category_id
    where cc.content_id = r.content_id
  ), '{}') <> array['job-board', 'skills-canada'];
  if bad is not null then
    raise exception 'rollback failed; wrong tag set for: %', array_to_string(bad, ', ');
  end if;

  raise notice 'job-board category and 13 video links restored';
end $$;
