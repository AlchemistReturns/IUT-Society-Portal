-- ============================================================================
-- RPC functions — atomic, authorization-checked state transitions.
-- Run as security definer (owned by the migration role, which bypasses RLS),
-- so these are the only path that writes application_history, notifications,
-- and cross-row application/membership transitions.
-- ============================================================================

create function public.notify(p_user_id uuid, p_type text, p_payload jsonb)
returns void as $$
begin
  insert into public.notifications (user_id, type, payload)
  values (p_user_id, p_type, p_payload);
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- Membership decisions
-- ----------------------------------------------------------------------------

create function public.decide_membership(p_request_id uuid, p_approve boolean)
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
  set status = case when p_approve then 'approved' else 'rejected' end,
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

-- ----------------------------------------------------------------------------
-- Application submission — snapshots the type's chain only on first submit;
-- a resubmission after CHANGES_REQUESTED keeps the original chain snapshot
-- and restarts at level 0.
-- ----------------------------------------------------------------------------

create function public.submit_application(p_app_id uuid)
returns void as $$
declare
  v_app applications;
begin
  select * into v_app from applications where id = p_app_id;
  if v_app is null then
    raise exception 'Application not found';
  end if;
  if not is_society_staff(auth.uid(), v_app.society_id) then
    raise exception 'Not authorized';
  end if;
  if v_app.status not in ('draft', 'changes_requested') then
    raise exception 'Application cannot be submitted from status %', v_app.status;
  end if;

  update applications
  set status = 'submitted',
      current_level_index = 0,
      chain_json = case
        when v_app.status = 'draft' then (
          select default_chain_json from application_types where id = v_app.type_id
        )
        else v_app.chain_json
      end
  where id = p_app_id;

  perform public.notify(
    v_app.created_by,
    'application_status',
    jsonb_build_object('application_id', p_app_id, 'status', 'submitted')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- Application review — approve / reject / request_changes at the reviewer's
-- current level. Approve requires signature + seal, saved to the reviewer's
-- profile for reuse. Reject and final-approve are terminal.
-- ----------------------------------------------------------------------------

create function public.review_application(
  p_app_id uuid,
  p_action application_action_enum,
  p_comment text default null,
  p_signature_url text default null,
  p_seal_url text default null
)
returns void as $$
declare
  v_app applications;
  v_entity chain_entity_enum;
  v_max_level int;
  v_is_last boolean;
begin
  select * into v_app from applications where id = p_app_id;
  if v_app is null then
    raise exception 'Application not found';
  end if;
  if v_app.status <> 'submitted' then
    raise exception 'Application is not awaiting review';
  end if;

  v_entity := public.current_review_entity(p_app_id);
  if not public.can_review_as(auth.uid(), v_app.society_id, v_entity) then
    raise exception 'Not authorized to review at this level';
  end if;

  if p_action = 'approve' then
    if p_signature_url is null or p_seal_url is null then
      raise exception 'Approval requires a signature and seal';
    end if;

    insert into user_signatures (user_id, signature_image_url, seal_image_url, updated_at)
    values (auth.uid(), p_signature_url, p_seal_url, now())
    on conflict (user_id) do update
      set signature_image_url = excluded.signature_image_url,
          seal_image_url = excluded.seal_image_url,
          updated_at = now();

    select max((elem ->> 'level_index')::int) into v_max_level
    from jsonb_array_elements(v_app.chain_json) elem;
    v_is_last := v_app.current_level_index >= v_max_level;

    update applications
    set status = case when v_is_last then 'approved' else 'submitted' end,
        current_level_index = case when v_is_last then v_app.current_level_index else v_app.current_level_index + 1 end
    where id = p_app_id;

  elsif p_action = 'reject' then
    update applications set status = 'rejected' where id = p_app_id;

  elsif p_action = 'request_changes' then
    update applications set status = 'changes_requested' where id = p_app_id;
  end if;

  insert into application_history
    (application_id, level_index, entity_role, actor_id, action, comment, signature_url, seal_url)
  values
    (p_app_id, v_app.current_level_index, v_entity, auth.uid(), p_action, p_comment, p_signature_url, p_seal_url);

  perform public.notify(
    v_app.created_by,
    'application_status',
    jsonb_build_object('application_id', p_app_id, 'status', p_action)
  );
end;
$$ language plpgsql security definer set search_path = public;
