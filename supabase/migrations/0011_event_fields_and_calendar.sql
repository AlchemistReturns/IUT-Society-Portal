-- ============================================================================
-- Event application fields + public academic/event calendar.
-- Remaining event fields (budget, purpose, ...) live in applications.details.
-- ============================================================================

alter table applications
  add column venue text,
  add column start_date date,
  add column end_date date;

alter table applications
  add constraint applications_dates_chk
  check (start_date is null or end_date is null or end_date >= start_date);

-- ----------------------------------------------------------------------------
-- Academic calendar (classes, exams, breaks, holidays), managed by Super Admin
-- ----------------------------------------------------------------------------
create table academic_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('classes', 'exams', 'break', 'short_term', 'holiday')),
  label text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table academic_calendar_entries enable row level security;

create policy calendar_entries_select on academic_calendar_entries for select
  to anon, authenticated using (true);
create policy calendar_entries_insert on academic_calendar_entries for insert
  to authenticated with check (is_super_admin(auth.uid()));
create policy calendar_entries_update on academic_calendar_entries for update
  to authenticated using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));
create policy calendar_entries_delete on academic_calendar_entries for delete
  to authenticated using (is_super_admin(auth.uid()));

grant select on academic_calendar_entries to anon, authenticated;
grant insert, update, delete on academic_calendar_entries to authenticated;

-- ----------------------------------------------------------------------------
-- Public event feed: only non-sensitive columns of in-flight/approved events.
-- SECURITY DEFINER so anonymous visitors can read it without table access.
-- ----------------------------------------------------------------------------
create function public.calendar_events()
returns table (
  id uuid,
  society_id uuid,
  society_name text,
  title text,
  venue text,
  start_date date,
  end_date date,
  status application_status_enum
) as $$
  select a.id, a.society_id, s.name, a.title, a.venue, a.start_date,
         coalesce(a.end_date, a.start_date), a.status
  from public.applications a
  join public.societies s on s.id = a.society_id
  where a.start_date is not null
    and a.status in ('submitted', 'approved');
$$ language sql stable security definer set search_path = public;

grant execute on function public.calendar_events() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Starter data for A.Y. 2025-26 (partial, read from the SCAC portal calendar).
-- Super Admin should verify and complete it under /admin/calendar.
-- ----------------------------------------------------------------------------
insert into academic_calendar_entries (kind, label, start_date, end_date) values
  ('classes', 'Winter - Classes, First Phase',      '2026-10-26', '2026-12-13'),
  ('exams',   'Winter - Mid-Semester Examination',  '2026-12-14', '2026-12-25'),
  ('classes', 'Winter - Classes, Second Phase',     '2026-12-28', '2027-02-14'),
  ('exams',   'Winter - Final Examination',         '2027-02-15', '2027-02-26'),
  ('break',   'Semester break',                     '2027-03-01', '2027-03-19'),
  ('holiday', 'Victory Day of Bangladesh',          '2026-12-16', '2026-12-16'),
  ('holiday', 'International Mother Language Day',  '2027-02-21', '2027-02-21'),
  ('holiday', 'Independence Day',                   '2027-03-26', '2027-03-26');
