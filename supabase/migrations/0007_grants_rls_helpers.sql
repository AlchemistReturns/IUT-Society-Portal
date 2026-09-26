-- ============================================================================
-- EXECUTE grants for helper functions referenced INSIDE RLS policy
-- expressions. Without these, evaluating the policy for role `authenticated`
-- fails with "permission denied for function" -- which surfaces as an error
-- on the query, not as an empty result, but call sites that don't check the
-- `error` field (see members page bug) will render it as "no rows found".
-- ============================================================================

grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.has_global_role(uuid, global_role_enum) to authenticated;
grant execute on function public.has_society_role(uuid, uuid, society_role_enum) to authenticated;
grant execute on function public.is_society_staff(uuid, uuid) to authenticated;
grant execute on function public.is_society_admin(uuid, uuid) to authenticated;
grant execute on function public.is_society_member(uuid, uuid) to authenticated;
grant execute on function public.is_society_moderator(uuid, uuid) to authenticated;
grant execute on function public.is_department_head(uuid, uuid) to authenticated;
grant execute on function public.is_university_reviewer(uuid) to authenticated;
grant execute on function public.can_review_as(uuid, uuid, chain_entity_enum) to authenticated;
grant execute on function public.current_review_entity(uuid) to authenticated;
