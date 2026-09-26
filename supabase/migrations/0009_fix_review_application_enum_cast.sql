-- ============================================================================
-- Same class of bug as decide_membership: a CASE expression's string
-- literals default to text and don't implicitly cast to
-- application_status_enum for an UPDATE ... SET assignment.
-- ============================================================================

create or replace function public.review_application(
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
    set status = case when v_is_last then 'approved'::application_status_enum else 'submitted'::application_status_enum end,
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
