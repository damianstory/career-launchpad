-- Idempotent guard: only fail if BOTH categories exist as separate rows,
-- which would mean a manual conflict that a human has to resolve. If only
-- `on-the-job` exists (the rename already happened — e.g. via a later
-- migration that handled it inline), this block is a no-op.
do $$
begin
  if exists (select 1 from public.categories where slug = 'day-in-the-life')
     and exists (select 1 from public.categories where slug = 'on-the-job') then
    raise exception 'Both day-in-the-life and on-the-job exist; manual reconciliation required';
  end if;
end $$;

alter table public.content
  add column if not exists why_it_matters text,
  add column if not exists planning_connection text,
  add column if not exists takeaway text;

-- No-op if day-in-the-life no longer exists.
update public.categories
set slug = 'on-the-job', name = 'On the Job'
where slug = 'day-in-the-life';

-- Manual rollback only:
-- update public.categories set slug = 'day-in-the-life' where slug = 'on-the-job';
-- alter table public.content
--   drop column if exists takeaway,
--   drop column if exists planning_connection,
--   drop column if exists why_it_matters;
