do $$
begin
  if exists (select 1 from public.categories where slug = 'on-the-job') then
    raise exception 'Cannot rename day-in-the-life: on-the-job already exists';
  end if;
end $$;

alter table public.content
  add column if not exists why_it_matters text,
  add column if not exists planning_connection text,
  add column if not exists takeaway text;

update public.categories
set slug = 'on-the-job', name = 'On the Job'
where slug = 'day-in-the-life';

-- Manual rollback only:
-- update public.categories set slug = 'day-in-the-life' where slug = 'on-the-job';
-- alter table public.content
--   drop column if exists takeaway,
--   drop column if exists planning_connection,
--   drop column if exists why_it_matters;
