-- ============================================================================
-- Auth wiring: domain-gated signup, users row sync, email-verification sync
-- ============================================================================

create function public.handle_new_user() returns trigger as $$
declare
  email_domain text;
  domain_count int;
begin
  email_domain := split_part(new.email, '@', 2);
  select count(*) into domain_count from public.allowed_email_domains;

  -- If any domains are configured, enforce them. Empty table = bootstrap
  -- phase (no restriction yet), so the first Super Admin can sign up.
  if domain_count > 0 and not exists (
    select 1 from public.allowed_email_domains where domain = email_domain
  ) then
    raise exception 'Signup rejected: email domain % is not allowed', email_domain;
  end if;

  insert into public.users (id, email, name, university_domain_verified)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.email_confirmed_at is not null
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_user_email_confirmed() returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.users
    set university_domain_verified = true
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row execute function public.handle_user_email_confirmed();
