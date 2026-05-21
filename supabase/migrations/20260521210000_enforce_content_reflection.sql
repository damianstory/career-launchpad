-- Enforce reflection on every content row.
-- PR 2c. Tightens the column added in 20260521170000_add_content_reflection.sql
-- now that all 252 published rows (and any unpublished rows) carry a value.

alter table public.content
  alter column reflection set not null;

alter table public.content
  add constraint content_reflection_nonblank
  check (length(trim(reflection)) > 0);
