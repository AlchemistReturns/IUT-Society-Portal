-- ============================================================================
-- RLS helper functions (security definer, stable) — avoid recursive RLS
-- ============================================================================

create function public.is_super_admin(uid uuid default auth.uid())
returns boolean as $$
  select exists (
    select 1 from public.global_roles
    where user_id = uid and role = 'super_admin'
  );
$$ language sql stable security definer set search_path = public;

create function public.has_global_role(uid uuid, r global_role_enum)
returns boolean as $$
  select exists (
    select 1 from public.global_roles
    where user_id = uid and role = r
  );
$$ language sql stable security definer set search_path = public;

create function public.has_society_role(uid uuid, sid uuid, r society_role_enum)
returns boolean as $$
  select exists (
    select 1 from public.society_roles
    where user_id = uid and society_id = sid and role = r
  );
$$ language sql stable security definer set search_path = public;

-- admin, executive, or sub_executive: the roles allowed to manage/edit content
create function public.is_society_staff(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from public.society_roles
    where user_id = uid and society_id = sid
      and role in ('admin', 'executive', 'sub_executive')
  );
$$ language sql stable security definer set search_path = public;

create function public.is_society_admin(uid uuid, sid uuid)
returns boolean as $$
  select public.has_society_role(uid, sid, 'admin');
$$ language sql stable security definer set search_path = public;

-- any role at all (incl. plain member) — i.e. belongs to the society
create function public.is_society_member(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from public.society_roles
    where user_id = uid and society_id = sid
  );
$$ language sql stable security definer set search_path = public;

create function public.is_society_moderator(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from public.societies
    where id = sid and moderator_id = uid
  );
$$ language sql stable security definer set search_path = public;

create function public.is_department_head(uid uuid, sid uuid)
returns boolean as $$
  select exists (
    select 1 from public.society_department_heads
    where society_id = sid and user_id = uid
  );
$$ language sql stable security definer set search_path = public;

-- University-wide reviewing entities (SCA, Student Welfare, Pro-VC, VC) plus
-- Super Admin, who can act at any level regardless of chain entity.
create function public.is_university_reviewer(uid uuid)
returns boolean as $$
  select public.is_super_admin(uid) or exists (
    select 1 from public.global_roles
    where user_id = uid
      and role in ('sca_committee', 'student_welfare', 'pro_vc', 'vc')
  );
$$ language sql stable security definer set search_path = public;

-- Can this user act as the given chain entity for this society right now?
create function public.can_review_as(uid uuid, sid uuid, entity chain_entity_enum)
returns boolean as $$
  select case entity
    when 'society_moderator' then public.is_society_moderator(uid, sid)
    when 'department_head' then public.is_department_head(uid, sid)
    when 'sca_committee' then public.has_global_role(uid, 'sca_committee')
    when 'student_welfare' then public.has_global_role(uid, 'student_welfare')
    when 'pro_vc' then public.has_global_role(uid, 'pro_vc')
    when 'vc' then public.has_global_role(uid, 'vc')
    else false
  end or public.is_super_admin(uid);
$$ language sql stable security definer set search_path = public;

-- The chain entity at applications.current_level_index, read from chain_json.
-- chain_json shape: [{ "level_index": 0, "entity": "society_moderator" }, ...]
create function public.current_review_entity(app_id uuid)
returns chain_entity_enum as $$
  select (elem ->> 'entity')::chain_entity_enum
  from public.applications a, jsonb_array_elements(a.chain_json) elem
  where a.id = app_id
    and (elem ->> 'level_index')::int = a.current_level_index
  limit 1;
$$ language sql stable security definer set search_path = public;

create function public.can_review_application(uid uuid, app_id uuid)
returns boolean as $$
  select a.status = 'submitted'
    and public.can_review_as(uid, a.society_id, public.current_review_entity(app_id))
  from public.applications a
  where a.id = app_id;
$$ language sql stable security definer set search_path = public;

-- Full visibility rule for an application: society members/staff, the
-- society's moderator/department head, any university-wide reviewer entity
-- who can currently act on it, anyone who has already acted on it (audit
-- trail), and Super Admin.
create function public.can_view_application(uid uuid, app_id uuid)
returns boolean as $$
  select
    public.is_super_admin(uid)
    or public.is_society_member(uid, a.society_id)
    or public.is_society_moderator(uid, a.society_id)
    or public.is_department_head(uid, a.society_id)
    or public.can_review_application(uid, app_id)
    or exists (
      select 1 from public.application_history h
      where h.application_id = app_id and h.actor_id = uid
    )
  from public.applications a
  where a.id = app_id;
$$ language sql stable security definer set search_path = public;
