-- ============================================================================
-- Row-Level Security
-- ============================================================================

alter table users enable row level security;
alter table allowed_email_domains enable row level security;
alter table global_roles enable row level security;
alter table societies enable row level security;
alter table society_roles enable row level security;
alter table society_department_heads enable row level security;
alter table membership_requests enable row level security;
alter table profile_sections enable row level security;
alter table activities enable row level security;
alter table achievements enable row level security;
alter table gallery_images enable row level security;
alter table reports enable row level security;
alter table custom_fields enable row level security;
alter table finance_entries enable row level security;
alter table application_types enable row level security;
alter table applications enable row level security;
alter table application_history enable row level security;
alter table user_signatures enable row level security;
alter table notifications enable row level security;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------

-- Directory-style visibility: any authenticated user can look up basic
-- profile info (needed for member lists, reviewer names, signature display).
create policy users_select_all on users for select
  to authenticated using (true);

-- Row creation happens only via the handle_new_user trigger (security definer).
create policy users_update_self on users for update
  to authenticated
  using (id = auth.uid() or is_super_admin(auth.uid()))
  with check (id = auth.uid() or is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- allowed_email_domains — Super Admin only
-- ----------------------------------------------------------------------------

create policy allowed_email_domains_super_admin on allowed_email_domains
  for all to authenticated
  using (is_super_admin(auth.uid()))
  with check (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- global_roles
-- ----------------------------------------------------------------------------

create policy global_roles_select on global_roles for select
  to authenticated
  using (user_id = auth.uid() or is_super_admin(auth.uid()));

create policy global_roles_manage on global_roles for all
  to authenticated
  using (is_super_admin(auth.uid()))
  with check (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- societies
-- ----------------------------------------------------------------------------

create policy societies_select_all on societies for select
  to authenticated using (true);

create policy societies_insert_super_admin on societies for insert
  to authenticated with check (is_super_admin(auth.uid()));

create policy societies_update on societies for update
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), id));

create policy societies_delete_super_admin on societies for delete
  to authenticated using (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- society_roles
-- ----------------------------------------------------------------------------

create policy society_roles_select on society_roles for select
  to authenticated
  using (
    is_super_admin(auth.uid())
    or is_society_member(auth.uid(), society_id)
    or is_society_moderator(auth.uid(), society_id)
    or is_department_head(auth.uid(), society_id)
  );

-- Super Admin manages everything; a Society Admin manages roles within their
-- own society, including appointing co-admins / transferring admin.
create policy society_roles_manage on society_roles for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id));

-- ----------------------------------------------------------------------------
-- society_department_heads — Super Admin only manages; society can view
-- ----------------------------------------------------------------------------

create policy dept_heads_select on society_department_heads for select
  to authenticated
  using (
    is_super_admin(auth.uid())
    or is_society_member(auth.uid(), society_id)
    or is_society_moderator(auth.uid(), society_id)
  );

create policy dept_heads_manage on society_department_heads for all
  to authenticated
  using (is_super_admin(auth.uid()))
  with check (is_super_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- membership_requests
-- ----------------------------------------------------------------------------

create policy membership_requests_select on membership_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or is_super_admin(auth.uid())
    or is_society_staff(auth.uid(), society_id)
  );

-- A verified user can (re)apply for themselves at any time.
create policy membership_requests_insert on membership_requests for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from users u
      where u.id = auth.uid() and u.university_domain_verified
    )
  );

-- Only Society Admin (or Super Admin) decides pending requests.
create policy membership_requests_decide on membership_requests for update
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id));

-- ----------------------------------------------------------------------------
-- Society profile content: readable by all authenticated users,
-- writable by society staff (admin/executive/sub-executive)
-- ----------------------------------------------------------------------------

create policy profile_sections_select on profile_sections for select
  to authenticated using (true);
create policy profile_sections_write on profile_sections for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id));

create policy activities_select on activities for select
  to authenticated using (true);
create policy activities_write on activities for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id));

create policy achievements_select on achievements for select
  to authenticated using (true);
create policy achievements_write on achievements for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id));

create policy gallery_images_select on gallery_images for select
  to authenticated using (true);
create policy gallery_images_write on gallery_images for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id));

create policy reports_select on reports for select
  to authenticated using (true);
create policy reports_write on reports for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id));

create policy custom_fields_select on custom_fields for select
  to authenticated using (true);
create policy custom_fields_write on custom_fields for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_staff(auth.uid(), society_id));

-- ----------------------------------------------------------------------------
-- finance_entries
-- Visibility: Society Admin/Executive (full), Moderator (view-only).
-- Entry: Society Admin only (not Executive/Sub-Executive).
-- ----------------------------------------------------------------------------

create policy finance_entries_select on finance_entries for select
  to authenticated
  using (
    is_super_admin(auth.uid())
    or has_society_role(auth.uid(), society_id, 'admin')
    or has_society_role(auth.uid(), society_id, 'executive')
    or is_society_moderator(auth.uid(), society_id)
  );

create policy finance_entries_write on finance_entries for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id));

-- ----------------------------------------------------------------------------
-- application_types — managed by Society Admin; visible to society + reviewers
-- ----------------------------------------------------------------------------

create policy application_types_select on application_types for select
  to authenticated
  using (
    is_super_admin(auth.uid())
    or is_society_member(auth.uid(), society_id)
    or is_society_moderator(auth.uid(), society_id)
    or is_department_head(auth.uid(), society_id)
    or is_university_reviewer(auth.uid())
  );

create policy application_types_write on application_types for all
  to authenticated
  using (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id))
  with check (is_super_admin(auth.uid()) or is_society_admin(auth.uid(), society_id));

-- ----------------------------------------------------------------------------
-- applications
-- ----------------------------------------------------------------------------

create policy applications_select on applications for select
  to authenticated
  using (can_view_application(auth.uid(), id));

-- Society Admin/Executive/Sub-Executive create + edit drafts and
-- changes-requested applications. Transitions to submitted/approved/rejected
-- happen through the review_application / submit_application RPCs.
create policy applications_insert on applications for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and is_society_staff(auth.uid(), society_id)
    and status = 'draft'
  );

create policy applications_update on applications for update
  to authenticated
  using (
    is_super_admin(auth.uid())
    or (is_society_staff(auth.uid(), society_id) and status in ('draft', 'changes_requested'))
  )
  with check (
    is_super_admin(auth.uid())
    or is_society_staff(auth.uid(), society_id)
  );

-- ----------------------------------------------------------------------------
-- application_history — read follows the parent application; writes go
-- through the review_application RPC (security definer) only.
-- ----------------------------------------------------------------------------

create policy application_history_select on application_history for select
  to authenticated
  using (can_view_application(auth.uid(), application_id));

-- ----------------------------------------------------------------------------
-- user_signatures — a reviewer manages only their own saved signature/seal
-- ----------------------------------------------------------------------------

create policy user_signatures_select on user_signatures for select
  to authenticated using (user_id = auth.uid() or is_super_admin(auth.uid()));

create policy user_signatures_write on user_signatures for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- notifications — strictly own inbox; writes happen via RPC/security definer
-- ----------------------------------------------------------------------------

create policy notifications_select on notifications for select
  to authenticated using (user_id = auth.uid());

create policy notifications_mark_read on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
