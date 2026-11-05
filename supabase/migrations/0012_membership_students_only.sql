-- Only students can request society membership. Anyone holding a university
-- role (global role, society moderator, or department head) is excluded.
create function public.can_request_membership(uid uuid)
returns boolean as $$
  select not exists (select 1 from public.global_roles where user_id = uid)
     and not exists (select 1 from public.societies where moderator_id = uid)
     and not exists (select 1 from public.society_department_heads where user_id = uid);
$$ language sql stable security definer set search_path = public;

grant execute on function public.can_request_membership(uuid) to authenticated;

drop policy if exists membership_requests_insert on membership_requests;

create policy membership_requests_insert on membership_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and can_request_membership(auth.uid())
    and exists (
      select 1 from users u
      where u.id = auth.uid() and u.university_domain_verified
    )
  );
