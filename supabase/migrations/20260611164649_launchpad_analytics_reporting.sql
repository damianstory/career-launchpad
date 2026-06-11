-- Centralized anonymous analytics for Career LaunchPAD.
-- Public clients may insert events; raw analytics and reporting views are not public-readable.

alter table public.analytics_events
  drop constraint if exists analytics_events_content_id_fkey;

alter table public.analytics_events
  alter column content_id type text using content_id::text;

alter table public.analytics_events
  add constraint analytics_events_content_id_fkey
  foreign key (content_id) references public.content(id) on delete set null;

alter table public.analytics_events
  add column if not exists event_id text,
  add column if not exists event_version integer not null default 1,
  add column if not exists visitor_id text,
  add column if not exists occurred_at timestamptz,
  add column if not exists device_type text not null default 'unknown',
  add column if not exists referrer_host text,
  add column if not exists page_path text not null default '/',
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text;

update public.analytics_events
set
  event_id = coalesce(event_id, 'legacy_' || id::text),
  visitor_id = coalesce(visitor_id, session_id, 'legacy_' || id::text),
  session_id = coalesce(session_id, 'legacy_' || id::text),
  occurred_at = coalesce(occurred_at, created_at),
  page_path = coalesce(nullif(page_path, ''), '/'),
  device_type = coalesce(nullif(device_type, ''), 'unknown')
where
  event_id is null
  or visitor_id is null
  or session_id is null
  or occurred_at is null
  or page_path is null
  or page_path = ''
  or device_type is null
  or device_type = '';

alter table public.analytics_events
  alter column event_id set not null,
  alter column visitor_id set not null,
  alter column session_id set not null,
  alter column occurred_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_event_id_key'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_event_id_key unique (event_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_device_type_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_device_type_check
      check (device_type in ('desktop', 'tablet', 'mobile', 'unknown'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_event_version_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_event_version_check
      check (event_version = 1);
  end if;
end $$;

create index if not exists idx_analytics_events_occurred_at
  on public.analytics_events (occurred_at desc);

create index if not exists idx_analytics_events_content_type_time
  on public.analytics_events (content_id, event_type, occurred_at desc);

create index if not exists idx_analytics_events_session_time
  on public.analytics_events (session_id, occurred_at);

create index if not exists idx_analytics_events_visitor_time
  on public.analytics_events (visitor_id, occurred_at);

create index if not exists idx_analytics_events_metadata
  on public.analytics_events using gin (metadata);

alter table public.analytics_events enable row level security;

drop policy if exists "Allow public insert to analytics_events" on public.analytics_events;
create policy "Allow public insert to analytics_events"
  on public.analytics_events
  for insert
  to anon
  with check (true);

grant insert on public.analytics_events to anon;
revoke select, update, delete on public.analytics_events from anon, authenticated;

create or replace view public.analytics_daily_traffic
with (security_invoker = true)
as
select
  occurred_at::date as report_date,
  count(*) as event_count,
  count(distinct visitor_id) as visitor_count,
  count(distinct session_id) as session_count,
  count(*) filter (where event_type = 'entry_view') as entry_views,
  count(*) filter (where event_type = 'content_open') as content_opens,
  count(*) filter (where event_type = 'video_play') as video_plays,
  count(*) filter (where event_type = 'video_complete') as video_completes,
  count(*) filter (where event_type = 'search_query') as searches,
  count(*) filter (where event_type = 'search_zero_results') as zero_result_searches,
  count(*) filter (where event_type = 'like' and coalesce(metadata->>'liked', 'true') = 'true') as likes,
  count(*) filter (where event_type = 'share') as shares
from public.analytics_events
group by occurred_at::date;

create or replace view public.analytics_content_engagement
with (security_invoker = true)
as
select
  e.content_id,
  c.slug,
  c.title,
  c.content_type as format,
  occurred_at::date as report_date,
  count(distinct e.visitor_id) as visitor_count,
  count(distinct e.session_id) as session_count,
  count(*) filter (where e.event_type = 'feed_impression') as feed_impressions,
  count(*) filter (where e.event_type = 'content_open') as content_opens,
  count(*) filter (where e.event_type = 'learn_more_open') as learn_more_opens,
  count(*) filter (where e.event_type = 'video_play') as video_plays,
  count(*) filter (where e.event_type = 'video_progress' and e.metadata->>'milestone' = '25') as video_progress_25,
  count(*) filter (where e.event_type = 'video_progress' and e.metadata->>'milestone' = '50') as video_progress_50,
  count(*) filter (where e.event_type = 'video_progress' and e.metadata->>'milestone' = '80') as video_progress_80,
  count(*) filter (where e.event_type = 'video_complete') as video_completes,
  count(*) filter (where e.event_type = 'like' and coalesce(e.metadata->>'liked', 'true') = 'true') as likes,
  count(*) filter (where e.event_type = 'share') as shares,
  count(*) filter (where e.event_type = 'outbound_click') as outbound_clicks,
  count(*) filter (where e.event_type = 'related_content_click') as related_content_clicks,
  round(
    count(*) filter (where e.event_type = 'video_complete')::numeric
    / nullif(count(*) filter (where e.event_type = 'video_play'), 0),
    4
  ) as video_completion_rate
from public.analytics_events e
left join public.content c on c.id = e.content_id
where e.content_id is not null
group by e.content_id, c.slug, c.title, c.content_type, occurred_at::date;

create or replace view public.analytics_search_terms
with (security_invoker = true)
as
select
  occurred_at::date as report_date,
  metadata->>'query' as query,
  count(*) filter (where event_type = 'search_query') as search_count,
  count(*) filter (where event_type = 'search_zero_results') as zero_result_count,
  count(*) filter (where event_type = 'search_result_click') as result_click_count,
  round(avg(
    case
      when metadata->>'resultCount' ~ '^[0-9]+$' then (metadata->>'resultCount')::numeric
      else null
    end
  ), 2) as average_result_count
from public.analytics_events
where event_type in ('search_query', 'search_zero_results', 'search_result_click')
  and metadata ? 'query'
group by occurred_at::date, metadata->>'query';

create or replace view public.analytics_session_paths
with (security_invoker = true)
as
select
  session_id,
  visitor_id,
  min(occurred_at) as started_at,
  max(occurred_at) as last_event_at,
  count(*) as event_count,
  count(distinct content_id) filter (where content_id is not null) as distinct_content_count,
  count(*) filter (where event_type = 'video_play') as video_plays,
  count(*) filter (where event_type = 'learn_more_open') as learn_more_opens,
  count(*) filter (where event_type = 'search_query') as searches,
  count(*) filter (where event_type = 'share') as shares,
  array_remove(array_agg(content_id order by occurred_at), null) as content_path
from public.analytics_events
group by session_id, visitor_id;

revoke all on public.analytics_daily_traffic from anon, authenticated;
revoke all on public.analytics_content_engagement from anon, authenticated;
revoke all on public.analytics_search_terms from anon, authenticated;
revoke all on public.analytics_session_paths from anon, authenticated;
