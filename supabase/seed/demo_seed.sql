-- ============================================================================
-- DEMO SEED — IUT Society Management System
-- ============================================================================
-- Run in the Supabase SQL editor (runs as postgres, bypasses RLS).
-- Requires migrations 0001-0012 to be applied first.
--
-- DESTRUCTIVE. In one transaction this script:
--   1. DELETES every user except the Super Admin (abrarhasan@iut-dhaka.edu),
--      and all data that hangs off them: applications, history, finance,
--      membership requests, notifications, signatures, roles.
--   2. DELETES every society except "IUT Computer Society", and wipes the
--      profile content of that one.
--   3. Re-creates demo users (all with password  Demo@12345 ), societies,
--      roles, application types, applications and finance data.
-- The Super Admin account and its global role are left untouched. The script
-- aborts (and rolls back) if that account cannot be found.
--
-- Content for IUT Computer Society comes from https://iutcs.iutoic-dhaka.edu/
-- (about text, activities, collaborations, faculty). The student leadership
-- (Subarno Neel, Shadab Bin Habib, Rad Shahmad Daiyan) was given by the
-- project owner and differs from what that site currently lists.
-- Everything marked "demo" (other students, other societies, applications,
-- finance rows) is made up for the demo.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Guard: the Super Admin must exist
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from public.users u
    join public.global_roles g on g.user_id = u.id and g.role = 'super_admin'
    where u.email = 'abrarhasan@iut-dhaka.edu'
  ) then
    raise exception 'Super Admin abrarhasan@iut-dhaka.edu not found - aborting, nothing was changed';
  end if;
end $$;

create or replace function pg_temp.admin_id() returns uuid language sql as $$
  select id from public.users where email = 'abrarhasan@iut-dhaka.edu'
$$;

-- ---------------------------------------------------------------------------
-- 1. Wipe (children first; several FKs to users have no ON DELETE CASCADE)
-- ---------------------------------------------------------------------------
delete from application_history;
delete from applications;
delete from application_types;
delete from finance_entries;
delete from membership_requests;
delete from notifications;
delete from user_signatures where user_id <> pg_temp.admin_id();
delete from society_department_heads;
delete from society_roles where user_id <> pg_temp.admin_id();
delete from global_roles where user_id <> pg_temp.admin_id();
-- the Super Admin's own row may point at a user that is about to be deleted
update global_roles set granted_by = null
where user_id = pg_temp.admin_id()
  and granted_by is not null
  and granted_by <> pg_temp.admin_id();

-- Keep (or create) the one society we are seeding properly.
create temp table seed_ids (key text primary key, id uuid not null);

do $$
declare
  v_soc uuid;
begin
  select id into v_soc from societies
  where lower(name) = 'iut computer society'
  order by created_at limit 1;

  if v_soc is null then
    insert into societies (name) values ('IUT Computer Society') returning id into v_soc;
  end if;

  insert into seed_ids values ('soc_iutcs', v_soc);

  -- profile content of the kept society is rebuilt below
  delete from profile_sections where society_id = v_soc;
  delete from activities where society_id = v_soc;
  delete from achievements where society_id = v_soc;
  delete from gallery_images where society_id = v_soc;
  delete from reports where society_id = v_soc;
  delete from custom_fields where society_id = v_soc;
  update societies set moderator_id = null, archived_at = null where id = v_soc;

  -- every other society goes (profile content cascades)
  update societies set moderator_id = null where id <> v_soc;
  delete from societies where id <> v_soc;
end $$;

-- All users except the Super Admin. public.users, roles, etc. cascade.
delete from auth.users where id <> pg_temp.admin_id();

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------
create or replace function pg_temp.uid(p_key text) returns uuid language sql as $$
  select id from seed_ids where key = p_key
$$;

-- Creates a confirmed email+password user; the on_auth_user_created trigger
-- fills public.users (name from metadata, verified = true).
create or replace function pg_temp.seed_user(p_key text, p_email text, p_name text)
returns uuid language plpgsql as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, extensions.crypt('Demo@12345', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_name), now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into seed_ids values (p_key, v_id);
  return v_id;
end $$;

-- Inline SVG data URIs so signatures and seals display without storage.
create or replace function pg_temp.sig_uri(p_name text) returns text language sql as $$
  select 'data:image/svg+xml;base64,' || replace(encode(convert_to(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 70"><text x="8" y="46" font-family="Brush Script MT, Segoe Script, cursive" font-style="italic" font-size="30" fill="#0b3d91">'
    || p_name || '</text><path d="M8 56c60-8 120-8 200-2" stroke="#0b3d91" stroke-width="1.5" fill="none"/></svg>',
    'UTF8'), 'base64'), E'\n', '')
$$;

create or replace function pg_temp.seal_uri(p_label text) returns text language sql as $$
  select 'data:image/svg+xml;base64,' || replace(encode(convert_to(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="#0f5a45" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="#0f5a45" stroke-width="1" stroke-dasharray="3 3"/><text x="50" y="46" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#0f5a45">IUT</text><text x="50" y="62" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#0f5a45">'
    || p_label || '</text></svg>',
    'UTF8'), 'base64'), E'\n', '')
$$;

-- ---------------------------------------------------------------------------
-- 3. Users (password for every demo account: Demo@12345)
-- ---------------------------------------------------------------------------
-- University reviewers (global roles)
select pg_temp.seed_user('vc',      'vc@iut-dhaka.edu',    'Vice Chancellor');
select pg_temp.seed_user('provc',   'provc@iut-dhaka.edu', 'Pro Vice Chancellor');
select pg_temp.seed_user('scac',    'scac@iut-dhaka.edu',  'Head, SCAC');
select pg_temp.seed_user('osw',     'osw@iut-dhaka.edu',   'Head, OSW');

-- Faculty
select pg_temp.seed_user('moniruzzaman', 'moniruzzaman@iut-dhaka.edu', 'Dr. Md Moniruzzaman');
select pg_temp.seed_user('hasanul',      'hasanul.kabir@iut-dhaka.edu', 'Dr. Md. Hasanul Kabir');
select pg_temp.seed_user('farhana',      'farhana.karim@iut-dhaka.edu', 'Dr. Farhana Karim');       -- demo
select pg_temp.seed_user('imran',        'imran.chowdhury@iut-dhaka.edu', 'Prof. Dr. Imran Chowdhury'); -- demo

-- IUTCS leadership
select pg_temp.seed_user('subarno', 'subarno.neel@iut-dhaka.edu',   'Subarno Neel');
select pg_temp.seed_user('shadab',  'shadab.habib@iut-dhaka.edu',   'Shadab Bin Habib');
select pg_temp.seed_user('rad',     'rad.daiyan@iut-dhaka.edu',     'Rad Shahmad Daiyan');

-- IUTCS demo students
select pg_temp.seed_user('nafisa', 'nafisa.rahman@iut-dhaka.edu',   'Nafisa Rahman');
select pg_temp.seed_user('tanvir', 'tanvir.ahmed@iut-dhaka.edu',    'Tanvir Ahmed');
select pg_temp.seed_user('ishrat', 'ishrat.jahan@iut-dhaka.edu',    'Ishrat Jahan');
select pg_temp.seed_user('mahin',  'mahin.chowdhury@iut-dhaka.edu', 'Mahin Chowdhury');
select pg_temp.seed_user('rafiq',  'rafiq.hasan@iut-dhaka.edu',     'Rafiq Hasan');
select pg_temp.seed_user('sadia',  'sadia.islam@iut-dhaka.edu',     'Sadia Islam');   -- pending request
select pg_temp.seed_user('arif',   'arif.mahmud@iut-dhaka.edu',     'Arif Mahmud');   -- pending request

-- Presidents of the other demo societies
select pg_temp.seed_user('anika',  'anika.tabassum@iut-dhaka.edu',  'Anika Tabassum');
select pg_temp.seed_user('rafsan', 'rafsan.jamil@iut-dhaka.edu',    'Rafsan Jamil');
select pg_temp.seed_user('mehrin', 'mehrin.sultana@iut-dhaka.edu',  'Mehrin Sultana');

-- Global roles
insert into global_roles (user_id, role, granted_by) values
  (pg_temp.uid('vc'),    'vc',              pg_temp.admin_id()),
  (pg_temp.uid('provc'), 'pro_vc',          pg_temp.admin_id()),
  (pg_temp.uid('scac'),  'sca_committee',   pg_temp.admin_id()),
  (pg_temp.uid('osw'),   'student_welfare', pg_temp.admin_id());

-- Reviewer signatures and seals, saved for reuse as the app does on first approval
insert into user_signatures (user_id, signature_image_url, seal_image_url) values
  (pg_temp.uid('moniruzzaman'), pg_temp.sig_uri('Moniruzzaman'), pg_temp.seal_uri('MODERATOR')),
  (pg_temp.uid('scac'),         pg_temp.sig_uri('Head, SCAC'),   pg_temp.seal_uri('SCAC')),
  (pg_temp.uid('osw'),          pg_temp.sig_uri('Head, OSW'),    pg_temp.seal_uri('OSW')),
  (pg_temp.uid('provc'),        pg_temp.sig_uri('Pro-VC'),       pg_temp.seal_uri('PRO-VC')),
  (pg_temp.uid('vc'),           pg_temp.sig_uri('Vice Chancellor'), pg_temp.seal_uri('VC'));

-- ---------------------------------------------------------------------------
-- 4. IUT Computer Society
-- ---------------------------------------------------------------------------
update societies set
  description = 'A student organization at the Islamic University of Technology, founded in 2008 by students of the Department of Computer Science and Engineering.',
  moderator_id = pg_temp.uid('moniruzzaman')
where id = pg_temp.uid('soc_iutcs');

insert into society_department_heads (society_id, user_id)
values (pg_temp.uid('soc_iutcs'), pg_temp.uid('hasanul'));

insert into society_roles (user_id, society_id, role) values
  (pg_temp.uid('subarno'), pg_temp.uid('soc_iutcs'), 'admin'),   -- President
  (pg_temp.uid('shadab'),  pg_temp.uid('soc_iutcs'), 'admin'),   -- Vice President
  (pg_temp.uid('rad'),     pg_temp.uid('soc_iutcs'), 'admin'),   -- Vice President
  (pg_temp.uid('nafisa'),  pg_temp.uid('soc_iutcs'), 'executive'),
  (pg_temp.uid('tanvir'),  pg_temp.uid('soc_iutcs'), 'sub_executive'),
  (pg_temp.uid('ishrat'),  pg_temp.uid('soc_iutcs'), 'member'),
  (pg_temp.uid('mahin'),   pg_temp.uid('soc_iutcs'), 'member'),
  (pg_temp.uid('rafiq'),   pg_temp.uid('soc_iutcs'), 'member');

insert into membership_requests (user_id, society_id, status, requested_at, decided_by, decided_at) values
  (pg_temp.uid('ishrat'), pg_temp.uid('soc_iutcs'), 'approved', now() - interval '40 days', pg_temp.uid('subarno'), now() - interval '39 days'),
  (pg_temp.uid('mahin'),  pg_temp.uid('soc_iutcs'), 'approved', now() - interval '35 days', pg_temp.uid('subarno'), now() - interval '34 days'),
  (pg_temp.uid('rafiq'),  pg_temp.uid('soc_iutcs'), 'approved', now() - interval '20 days', pg_temp.uid('shadab'),  now() - interval '19 days');

insert into membership_requests (user_id, society_id, status, requested_at) values
  (pg_temp.uid('sadia'), pg_temp.uid('soc_iutcs'), 'pending', now() - interval '2 days'),
  (pg_temp.uid('arif'),  pg_temp.uid('soc_iutcs'), 'pending', now() - interval '1 day');

insert into profile_sections (society_id, mission, vision) values (
  pg_temp.uid('soc_iutcs'),
  'A platform for young computer engineers and students to develop technical skills, collaborate on projects, and engage with the wider technology community.',
  null
);

insert into activities (society_id, title, description, created_by) values
  (pg_temp.uid('soc_iutcs'), 'Programming & Development Classes',
   'Regular ACM-standard programming classes and app and web development sessions.', pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'Research Seminars',
   'Seminars with industry professionals and academics on technologies and research.', pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'Workshops & Projects',
   'Hands-on workshops and co-curricular projects for practical experience.', pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'Programming Contests',
   'Competitive coding events for algorithmic thinking and problem solving.', pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'Hackathons',
   'Innovation marathons, including Bangladesh''s first university-level game jam.', pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'IT Olympiads, E-sports & Business Cases',
   'A wider set of competitions across IT knowledge, gaming, and strategy.', pg_temp.uid('subarno'));

insert into achievements (society_id, title, description, winners, created_by) values
  (pg_temp.uid('soc_iutcs'), 'IUT ICT Fest',
   'A landmark event in Bangladesh''s ICT scene since 2008, bringing together students, innovators and technology communities through competitions and collaborative programs. The 12th edition is at iutictfest26.tech.',
   '[]'::jsonb, pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'First university-level game jam in Bangladesh',
   'Partnered with Brain Station 23 for Bangladesh''s pioneering university-level game development hackathon.',
   '[]'::jsonb, pg_temp.uid('subarno')),
  (pg_temp.uid('soc_iutcs'), 'Agent X national AI competition',
   'Collaborated with NetCom Learning on Agent X, which involved more than 50,000 students across Bangladesh.',
   '[]'::jsonb, pg_temp.uid('subarno'));

insert into custom_fields (society_id, label, type, value, sort_order) values
  (pg_temp.uid('soc_iutcs'), 'Founded', 'text', '2008', 1),
  (pg_temp.uid('soc_iutcs'), 'Teams', 'text', '9 specialized teams', 2),
  (pg_temp.uid('soc_iutcs'), 'Chairman', 'text', 'Dr. Md. Hasanul Kabir, Professor and Head, CSE Department, IUT', 3),
  (pg_temp.uid('soc_iutcs'), 'Flagship event', 'text', 'IUT ICT Fest (iutictfest26.tech)', 4),
  (pg_temp.uid('soc_iutcs'), 'Past collaborations', 'text', 'Robi Axiata, StreamsTech, BDApps, Brain Station 23, NetCom Learning, Bengali.AI, Prime Bank, FSIBL', 5);

-- Application types and approval chains
insert into application_types (society_id, name, default_chain_json) values
  (pg_temp.uid('soc_iutcs'), 'Event', '[
     {"level_index":0,"entity":"society_moderator"},
     {"level_index":1,"entity":"sca_committee"},
     {"level_index":2,"entity":"student_welfare"},
     {"level_index":3,"entity":"pro_vc"},
     {"level_index":4,"entity":"vc"}]'::jsonb),
  (pg_temp.uid('soc_iutcs'), 'Permission', '[
     {"level_index":0,"entity":"society_moderator"},
     {"level_index":1,"entity":"sca_committee"}]'::jsonb),
  (pg_temp.uid('soc_iutcs'), 'Logistic Support', '[
     {"level_index":0,"entity":"society_moderator"},
     {"level_index":1,"entity":"department_head"},
     {"level_index":2,"entity":"student_welfare"}]'::jsonb);

-- ---------------------------------------------------------------------------
-- 5. Demo applications, one per state (demo data)
-- ---------------------------------------------------------------------------
do $$
declare
  v_soc uuid := pg_temp.uid('soc_iutcs');
  v_event uuid;
  v_perm uuid;
  v_logi uuid;
  v_chain_event jsonb;
  v_chain_logi jsonb;
  v_app uuid;
begin
  select id, default_chain_json into v_event, v_chain_event from application_types where society_id = v_soc and name = 'Event';
  select id into v_perm from application_types where society_id = v_soc and name = 'Permission';
  select id, default_chain_json into v_logi, v_chain_logi from application_types where society_id = v_soc and name = 'Logistic Support';

  -- A. Fully approved
  insert into applications (society_id, type_id, title, venue, start_date, end_date, details, status, current_level_index, chain_json, created_by, created_at)
  values (v_soc, v_event, 'Intra-IUT Programming Contest 2026', 'CSE Lab Complex', '2026-11-21', '2026-11-21',
    jsonb_build_object(
      'time', '9:00 AM - 5:00 PM', 'participants', '120 students',
      'support', jsonb_build_array('permission', 'logistical'),
      'purpose', 'An individual-ranked programming contest to find and train IUT''s strongest problem solvers ahead of the national contests.',
      'logistics', '(a) CSE lab complex for 6 hours; (b) projector and display screens; (c) refreshments for 120 participants.',
      'budget_total', '45000', 'budget_secured', '30000', 'budget_requested', '15000',
      'funding_sources', 'Sponsor contribution and IUTCS funds',
      'impact', 'Strengthens competitive programming culture and raises IUT''s visibility in national contests.',
      'partner', ''),
    'approved', 4, v_chain_event, pg_temp.uid('subarno'), now() - interval '30 days')
  returning id into v_app;

  insert into application_history (application_id, level_index, entity_role, actor_id, action, comment, signature_url, seal_url, created_at) values
    (v_app, 0, 'society_moderator', pg_temp.uid('moniruzzaman'), 'approve', 'Approved. Please keep the lab rules in the briefing.', pg_temp.sig_uri('Moniruzzaman'), pg_temp.seal_uri('MODERATOR'), now() - interval '28 days'),
    (v_app, 1, 'sca_committee',     pg_temp.uid('scac'),         'approve', 'Cleared by SCAC.',                                         pg_temp.sig_uri('Head, SCAC'),   pg_temp.seal_uri('SCAC'),      now() - interval '26 days'),
    (v_app, 2, 'student_welfare',   pg_temp.uid('osw'),          'approve', 'Approved from the Office of Student Welfare.',             pg_temp.sig_uri('Head, OSW'),    pg_temp.seal_uri('OSW'),       now() - interval '24 days'),
    (v_app, 3, 'pro_vc',            pg_temp.uid('provc'),        'approve', 'Approved.',                                                pg_temp.sig_uri('Pro-VC'),       pg_temp.seal_uri('PRO-VC'),    now() - interval '22 days'),
    (v_app, 4, 'vc',                pg_temp.uid('vc'),           'approve', 'Approved. Best wishes to the participants.',               pg_temp.sig_uri('Vice Chancellor'), pg_temp.seal_uri('VC'),     now() - interval '20 days');

  -- B. Pending at level 3 (Student Welfare is next to act)
  insert into applications (society_id, type_id, title, venue, start_date, end_date, details, status, current_level_index, chain_json, created_by, created_at)
  values (v_soc, v_event, 'IUTCS Game Jam 2026', 'IUT Auditorium and CSE Lab', '2026-12-05', '2026-12-07',
    jsonb_build_object(
      'time', 'Friday 3:00 PM to Sunday 6:00 PM', 'participants', '80 students in 20 teams',
      'support', jsonb_build_array('permission', 'logistical', 'financial'),
      'purpose', 'A 48-hour game development hackathon where teams build a playable game around a surprise theme.',
      'logistics', '(a) auditorium and two labs for three days; (b) overnight access for participants; (c) extension boards and network access.',
      'budget_total', '120000', 'budget_secured', '70000', 'budget_requested', '50000',
      'funding_sources', 'Industry partner, registration fees',
      'impact', 'Hands-on experience in game development for students outside the usual coursework.',
      'partner', 'Industry partner (official e-mail to the VC to be attached)'),
    'submitted', 2, v_chain_event, pg_temp.uid('shadab'), now() - interval '9 days')
  returning id into v_app;

  insert into application_history (application_id, level_index, entity_role, actor_id, action, comment, signature_url, seal_url, created_at) values
    (v_app, 0, 'society_moderator', pg_temp.uid('moniruzzaman'), 'approve', 'Good plan. Approved.', pg_temp.sig_uri('Moniruzzaman'), pg_temp.seal_uri('MODERATOR'), now() - interval '7 days'),
    (v_app, 1, 'sca_committee',     pg_temp.uid('scac'),         'approve', 'Approved by SCAC.',   pg_temp.sig_uri('Head, SCAC'),   pg_temp.seal_uri('SCAC'),      now() - interval '5 days');

  -- C. Changes requested at level 0
  insert into applications (society_id, type_id, title, venue, start_date, end_date, details, status, current_level_index, chain_json, created_by, created_at)
  values (v_soc, v_event, 'Alumni Talk: AI in Industry', 'CSE Seminar Room', '2026-12-19', '2026-12-19',
    jsonb_build_object(
      'time', '4:00 PM - 6:00 PM', 'participants', '100 students',
      'support', jsonb_build_array('permission'),
      'purpose', 'An alumni speaker shares how AI is used in industry and what skills students should build.',
      'budget_total', '5000', 'budget_secured', '0', 'budget_requested', '5000',
      'funding_sources', 'IUT',
      'impact', 'Career guidance for final-year students.'),
    'changes_requested', 0, v_chain_event, pg_temp.uid('subarno'), now() - interval '6 days')
  returning id into v_app;

  insert into application_history (application_id, level_index, entity_role, actor_id, action, comment, created_at) values
    (v_app, 0, 'society_moderator', pg_temp.uid('moniruzzaman'), 'request_changes',
     'Please attach the speaker''s confirmation and a revised budget breakdown, then resubmit.', now() - interval '4 days');

  -- D. Draft
  insert into applications (society_id, type_id, title, venue, start_date, end_date, details, status, created_by, created_at)
  values (v_soc, v_perm, 'Web Development Bootcamp', 'CSE Lab 2', '2027-01-16', '2027-01-17',
    jsonb_build_object(
      'time', '10:00 AM - 4:00 PM', 'participants', '40 students',
      'support', jsonb_build_array('permission'),
      'purpose', 'A two-day hands-on bootcamp covering modern web development for first and second year students.'),
    'draft', pg_temp.uid('rad'), now() - interval '1 day');

  -- E. Just submitted, waiting at level 0 for the moderator
  insert into applications (society_id, type_id, title, venue, start_date, end_date, details, status, current_level_index, chain_json, created_by, created_at)
  values (v_soc, v_logi, 'Auditorium booking for ICT Fest planning', 'IUT Auditorium', '2026-11-28', '2026-11-28',
    jsonb_build_object(
      'time', '2:00 PM - 5:00 PM', 'participants', '60 volunteers',
      'support', jsonb_build_array('logistical'),
      'purpose', 'Volunteer orientation and team briefing ahead of the ICT Fest.',
      'logistics', '(a) auditorium for 3 hours; (b) projector and microphone.'),
    'submitted', 0, v_chain_logi, pg_temp.uid('subarno'), now() - interval '1 day');
end $$;

-- ---------------------------------------------------------------------------
-- 6. Finance (demo data, BDT)
-- ---------------------------------------------------------------------------
insert into finance_entries (society_id, type, amount, category, note, entered_by, date) values
  (pg_temp.uid('soc_iutcs'), 'income',  60000, 'Sponsorship',      'Programming contest sponsor',        pg_temp.uid('subarno'), '2026-08-12'),
  (pg_temp.uid('soc_iutcs'), 'income',  12000, 'Membership fees',  'Semester membership drive',          pg_temp.uid('subarno'), '2026-09-03'),
  (pg_temp.uid('soc_iutcs'), 'income',  25000, 'Registration fees','Intra-IUT contest registrations',    pg_temp.uid('shadab'),  '2026-10-15'),
  (pg_temp.uid('soc_iutcs'), 'income',  40000, 'Sponsorship',      'Game jam partner advance',           pg_temp.uid('subarno'), '2026-11-02'),
  (pg_temp.uid('soc_iutcs'), 'expense', 15000, 'Venue',            'Lab setup and extension boards',     pg_temp.uid('subarno'), '2026-08-28'),
  (pg_temp.uid('soc_iutcs'), 'expense',  8500, 'Printing',         'Banners and certificates',           pg_temp.uid('shadab'),  '2026-09-18'),
  (pg_temp.uid('soc_iutcs'), 'expense', 12000, 'Prizes',           'Contest prizes',                     pg_temp.uid('subarno'), '2026-10-22'),
  (pg_temp.uid('soc_iutcs'), 'expense',  9000, 'Refreshments',     'Contest day snacks and lunch',       pg_temp.uid('rad'),     '2026-10-22'),
  (pg_temp.uid('soc_iutcs'), 'expense',  6500, 'Marketing',        'Social media promotion',             pg_temp.uid('shadab'),  '2026-10-30'),
  (pg_temp.uid('soc_iutcs'), 'expense', 11000, 'Equipment',        'Cables and adapters',                pg_temp.uid('subarno'), '2026-11-03');

-- ---------------------------------------------------------------------------
-- 7. Other demo societies (all demo content)
-- ---------------------------------------------------------------------------
do $$
declare
  v_id uuid;
begin
  insert into societies (name, description, moderator_id) values
    ('IUT Debating Society', 'Debating, public speaking and parliamentary-style discussion at IUT.', pg_temp.uid('farhana'))
    returning id into v_id;
  insert into profile_sections (society_id, mission) values (v_id, 'To build confident speakers and clear thinkers through regular debates and workshops.');
  insert into society_roles (user_id, society_id, role) values (pg_temp.uid('anika'), v_id, 'admin');

  insert into societies (name, description, moderator_id) values
    ('IUT Photographic Society', 'Photography walks, exhibitions and workshops for IUT students.', pg_temp.uid('farhana'))
    returning id into v_id;
  insert into profile_sections (society_id, mission) values (v_id, 'To nurture visual storytelling and photography skills on campus.');
  insert into society_roles (user_id, society_id, role) values (pg_temp.uid('rafsan'), v_id, 'admin');

  insert into societies (name, description, moderator_id) values
    ('IUT Art and Cultural Society', 'Art, music and cultural programs celebrated across the IUT calendar.', pg_temp.uid('imran'))
    returning id into v_id;
  insert into profile_sections (society_id, mission) values (v_id, 'To celebrate and nurture the arts and culture within the IUT community.');
  insert into society_roles (user_id, society_id, role) values (pg_temp.uid('mehrin'), v_id, 'admin');
end $$;

-- ---------------------------------------------------------------------------
-- 8. Summary
-- ---------------------------------------------------------------------------
drop table seed_ids;

commit;

select u.email, u.name,
       coalesce(string_agg(distinct g.role::text, ', '), '') as global_roles
from public.users u
left join public.global_roles g on g.user_id = u.id
group by u.email, u.name
order by u.email;
