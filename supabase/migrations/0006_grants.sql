-- ============================================================================
-- Explicit EXECUTE grants for RPC/helper functions callable from the client.
-- ============================================================================

grant execute on function public.decide_membership(uuid, boolean) to authenticated;
grant execute on function public.submit_application(uuid) to authenticated;
grant execute on function public.review_application(uuid, application_action_enum, text, text, text) to authenticated;
grant execute on function public.can_review_application(uuid, uuid) to authenticated;
grant execute on function public.can_view_application(uuid, uuid) to authenticated;
