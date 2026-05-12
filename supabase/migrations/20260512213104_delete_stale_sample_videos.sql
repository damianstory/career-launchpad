-- Remove the two leftover sample videos seeded in
-- supabase/historical/contenthub-migrations/003_seed_content.sql.
-- They use placeholder YouTube IDs (dQw4w9WgXcQ, abc123xyz) and never
-- represented real content. Their content_categories rows cascade.

do $$
declare
  deleted_count int;
begin
  delete from public.content
  where id in ('video-ai-engineer-day', 'video-interview-tips');

  get diagnostics deleted_count = row_count;
  raise notice 'Deleted % stale sample video row(s)', deleted_count;
  -- A delete count of 0, 1, or 2 are all acceptable: the rows may already
  -- have been removed manually. The id column is unique, so a count above
  -- 2 is impossible.
end $$;
