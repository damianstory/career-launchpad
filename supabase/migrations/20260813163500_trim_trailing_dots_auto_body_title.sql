-- Drop the trailing ".." from the auto body repair video title.
-- The double period came through verbatim from the source listing; the
-- title should end at "shops". Targets the row by stable id.
-- Fails the transaction if the expected number of rows is not updated.

do $$
declare
  expected_count int := 1;
  actual_count int;
begin
  update public.content
  set title = 'How AI will affect Auto Body and other repair shops',
      updated_at = now()
  where id = 'skills-canada-107';

  get diagnostics actual_count = row_count;
  if actual_count <> expected_count then
    raise exception 'Expected % rows updated, got %', expected_count, actual_count;
  end if;
end $$;
