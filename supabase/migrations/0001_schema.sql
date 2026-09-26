-- ============================================================================
-- University Society Management System — initial schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type global_role_enum as enum (
  'super_admin',
  'sca_committee',
  'student_welfare',
  'pro_vc',
  'vc'
);

create type society_role_enum as enum (
  'admin',
  'executive',
  'sub_executive',
  'member'
);

create type membership_status_enum as enum (
  'pending',
  'approved',
  'rejected'
);

create type application_status_enum as enum (
  'draft',
  'submitted',
  'changes_requested',
  'approved',
  'rejected'
);

create type application_action_enum as enum (
  'approve',
  'reject',
  'request_changes'
);

-- Entities that can appear as a level in an approval chain.
create type chain_entity_enum as enum (
  'society_moderator',
  'department_head',
  'sca_committee',
  'student_welfare',
  'pro_vc',
  'vc'
);

create type custom_field_type_enum as enum (
  'text',
  'richtext',
  'image'
);

create type finance_type_enum as enum (
  'income',
  'expense'
);

-- ----------------------------------------------------------------------------
-- Core identity
-- ----------------------------------------------------------------------------

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  university_domain_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table allowed_email_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  created_at timestamptz not null default now()
);

create table global_roles (
  user_id uuid not null references users (id) on delete cascade,
  role global_role_enum not null,
  granted_by uuid references users (id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ----------------------------------------------------------------------------
-- Societies & membership
-- ----------------------------------------------------------------------------

create table societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  moderator_id uuid references users (id),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- Multiple rows per (user, society) allowed for different roles; multiple
-- admins per society are allowed (co-admin / transfer), enforced in app layer.
create table society_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  society_id uuid not null references societies (id) on delete cascade,
  role society_role_enum not null,
  created_at timestamptz not null default now(),
  unique (user_id, society_id, role)
);

-- One Department Head per society, assigned by Super Admin.
create table society_department_heads (
  society_id uuid primary key references societies (id) on delete cascade,
  user_id uuid not null references users (id),
  assigned_at timestamptz not null default now()
);

create table membership_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  society_id uuid not null references societies (id) on delete cascade,
  status membership_status_enum not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_by uuid references users (id),
  decided_at timestamptz
);

-- Reapply is allowed anytime; do not uniq-constrain (user_id, society_id).
create index membership_requests_user_society_idx
  on membership_requests (user_id, society_id);

-- ----------------------------------------------------------------------------
-- Society profile
-- ----------------------------------------------------------------------------

create table profile_sections (
  society_id uuid primary key references societies (id) on delete cascade,
  mission text,
  vision text,
  updated_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  title text not null,
  description text,
  images text[] not null default '{}',
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create table achievements (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  title text not null,
  description text,
  winners jsonb not null default '[]', -- [{ name, detail? }]
  images text[] not null default '{}',
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create table gallery_images (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  file_url text not null,
  title text not null,
  uploaded_by uuid references users (id),
  uploaded_at timestamptz not null default now()
);

create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  label text not null,
  type custom_field_type_enum not null,
  value text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Finance tracker
-- ----------------------------------------------------------------------------

create table finance_entries (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  type finance_type_enum not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category text not null,
  note text,
  entered_by uuid not null references users (id),
  date date not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Applications & approval workflow
-- ----------------------------------------------------------------------------

create table application_types (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  name text not null,
  -- [{ level_index, entity: chain_entity_enum }]
  default_chain_json jsonb not null default '[]',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  type_id uuid not null references application_types (id),
  title text not null,
  details jsonb not null default '{}',
  status application_status_enum not null default 'draft',
  current_level_index int not null default 0,
  -- snapshot of application_types.default_chain_json at submit time
  chain_json jsonb not null default '[]',
  created_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table application_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  level_index int not null,
  entity_role chain_entity_enum not null,
  actor_id uuid references users (id),
  action application_action_enum not null,
  comment text,
  signature_url text,
  seal_url text,
  created_at timestamptz not null default now()
);

create table user_signatures (
  user_id uuid primary key references users (id) on delete cascade,
  signature_image_url text,
  seal_image_url text,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Notifications (in-app)
-- ----------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  type text not null, -- e.g. membership_decision, application_status, resubmission_requested
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on notifications (user_id) where read_at is null;

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger applications_set_updated_at
  before update on applications
  for each row execute function set_updated_at();
