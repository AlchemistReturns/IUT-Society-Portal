-- ============================================================================
-- Fix: the CASE expression's string literals defaulted to text, which
-- postgres won't implicitly cast to membership_status_enum for a CASE
-- result (unlike a plain literal assigned directly to an enum column).
-- ============================================================================

create or replace function public.decide_membership(p_request_id uuid, p_approve boolean)
returns void as $$
declare
  v_req membership_requests;
begin
  select * into v_req from membership_requests where id = p_request_id;
  if v_req is null then
    raise exception 'Membership request not found';
  end if;
  if not (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), v_req.society_id)) then
    raise exception 'Not authorized';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'Request already decided';
  end if;

  update membership_requests
  set status = case when p_approve then 'approved'::membership_status_enum else 'rejected'::membership_status_enum end,
      decided_by = auth.uid(),
      decided_at = now()
  where id = p_request_id;

  if p_approve then
    insert into society_roles (user_id, society_id, role)
    values (v_req.user_id, v_req.society_id, 'member')
    on conflict (user_id, society_id, role) do nothing;
  end if;

  perform public.notify(
    v_req.user_id,
    'membership_decision',
    jsonb_build_object(
      'society_id', v_req.society_id,
      'approved', p_approve
    )
  );
end;
$$ language plpgsql security definer set search_path = public;
