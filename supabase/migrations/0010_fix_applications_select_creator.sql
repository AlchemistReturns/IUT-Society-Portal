-- INSERT ... RETURNING checks the SELECT policy against the new row.
-- can_view_application() is STABLE and looks the row up in `applications`
-- by id, so it cannot see the row being inserted and returns NULL, making
-- every insert fail with "new row violates row-level security policy".
-- Creators can always see their own applications, which short-circuits it.
drop policy if exists applications_select on applications;

create policy applications_select on applications for select
  to authenticated
  using (
    created_by = auth.uid()
    or can_view_application(auth.uid(), id)
  );
