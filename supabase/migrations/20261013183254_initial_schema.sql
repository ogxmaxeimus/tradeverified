-- TradeVerified pilot schema.
-- Manual credential review, public worker directory, employer jobs, applications.
-- Authorization reads public.profiles.role via private helpers. Signup metadata
-- cannot grant the admin role (see private.handle_new_user).

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.user_role as enum ('worker', 'employer', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.credential_kind as enum ('license', 'certification');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.job_status as enum ('open', 'closed');
create type public.employment_type as enum ('full_time', 'contract', 'part_time');
create type public.application_status as enum ('submitted', 'reviewed', 'accepted', 'declined');
create type public.pay_unit as enum ('hour', 'year', 'project');

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'worker',
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  city text check (city is null or char_length(city) between 1 and 80),
  state text check (state is null or state ~ '^[A-Z]{2}$'),
  headline text check (headline is null or char_length(headline) <= 140),
  bio text check (bio is null or char_length(bio) <= 2000),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.worker_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  trade text not null check (trade in (
    'HVAC', 'Plumbing', 'Electrical', 'Welding', 'Carpentry', 'Mechanics', 'Construction'
  )),
  years_experience integer not null default 0 check (years_experience between 0 and 80),
  hourly_rate numeric(8, 2) check (hourly_rate is null or hourly_rate >= 0),
  open_to_work boolean not null default true,
  verification_status public.verification_status not null default 'unverified',
  verified_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.employer_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  company_name text not null check (char_length(btrim(company_name)) between 1 and 160),
  website text check (website is null or char_length(website) <= 200),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles (profile_id) on delete cascade,
  kind public.credential_kind not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  issuing_authority text not null check (char_length(btrim(issuing_authority)) between 1 and 160),
  license_number text check (license_number is null or char_length(license_number) <= 80),
  state text check (state is null or state ~ '^[A-Z]{2}$'),
  issued_on date,
  expires_on date,
  document_path text check (document_path is null or char_length(document_path) <= 400),
  status public.review_status not null default 'pending',
  review_note text check (review_note is null or char_length(review_note) <= 1000),
  reviewed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  constraint credentials_dates_order check (
    issued_on is null or expires_on is null or expires_on >= issued_on
  )
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles (profile_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  description text check (description is null or char_length(description) <= 2000),
  image_path text not null check (char_length(image_path) between 1 and 400),
  completed_on date,
  created_at timestamptz not null default pg_catalog.now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles (profile_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  trade text not null check (trade in (
    'HVAC', 'Plumbing', 'Electrical', 'Welding', 'Carpentry', 'Mechanics', 'Construction'
  )),
  description text not null check (char_length(description) between 1 and 5000),
  city text not null check (char_length(btrim(city)) between 1 and 80),
  state text not null check (state ~ '^[A-Z]{2}$'),
  employment_type public.employment_type not null,
  pay_min numeric(10, 2) check (pay_min is null or pay_min >= 0),
  pay_max numeric(10, 2) check (pay_max is null or pay_max >= 0),
  pay_unit public.pay_unit,
  required_certification text check (
    required_certification is null or char_length(required_certification) <= 160
  ),
  status public.job_status not null default 'open',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint jobs_pay_order check (
    pay_min is null or pay_max is null or pay_max >= pay_min
  )
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  worker_id uuid not null references public.worker_profiles (profile_id) on delete cascade,
  cover_note text check (cover_note is null or char_length(cover_note) <= 2000),
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  unique (job_id, worker_id)
);

create index profiles_state_city_idx on public.profiles (state, city);
create index worker_profiles_trade_idx on public.worker_profiles (trade);
create index worker_profiles_verification_idx on public.worker_profiles (verification_status);
create index credentials_worker_id_idx on public.credentials (worker_id);
create index credentials_status_idx on public.credentials (status);
create index portfolio_items_worker_id_idx on public.portfolio_items (worker_id);
create index jobs_employer_id_idx on public.jobs (employer_id);
create index jobs_open_trade_idx on public.jobs (trade, state) where status = 'open';
create index applications_worker_id_idx on public.applications (worker_id);
create index applications_job_id_idx on public.applications (job_id);

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create trigger worker_profiles_touch_updated_at
before update on public.worker_profiles
for each row execute function private.touch_updated_at();

create trigger employer_profiles_touch_updated_at
before update on public.employer_profiles
for each row execute function private.touch_updated_at();

create trigger jobs_touch_updated_at
before update on public.jobs
for each row execute function private.touch_updated_at();

create trigger applications_touch_updated_at
before update on public.applications
for each row execute function private.touch_updated_at();

-- Role lookup bypasses RLS so policies can call it without recursion.
create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.is_job_employer(target_job uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs
    where id = target_job
      and employer_id = (select auth.uid())
  );
$$;

create or replace function private.has_applied(target_job uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications
    where job_id = target_job
      and worker_id = (select auth.uid())
  );
$$;

create or replace function private.job_is_open(target_job uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs
    where id = target_job
      and status = 'open'
  );
$$;

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    -- Direct SQL (no JWT), used by seed and the SQL editor, may change roles.
    -- Authenticated API users cannot, including by editing user_metadata.
    if (select auth.uid()) is not null
      and (select private.current_role()) is distinct from 'admin' then
      raise exception 'profile role cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
before update on public.profiles
for each row execute function private.protect_profile_role();

create or replace function private.sync_worker_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wid uuid;
  new_status public.verification_status;
begin
  wid := coalesce(new.worker_id, old.worker_id);

  if exists (
    select 1 from public.credentials
    where worker_id = wid and status = 'approved'
  ) then
    new_status := 'verified';
  elsif exists (
    select 1 from public.credentials
    where worker_id = wid and status = 'pending'
  ) then
    new_status := 'pending';
  elsif exists (
    select 1 from public.credentials
    where worker_id = wid and status = 'rejected'
  ) then
    new_status := 'rejected';
  else
    new_status := 'unverified';
  end if;

  update public.worker_profiles
  set
    verification_status = new_status,
    verified_at = case
      when new_status = 'verified' then coalesce(verified_at, pg_catalog.now())
      else null
    end
  where profile_id = wid;

  return coalesce(new, old);
end;
$$;

create trigger credentials_sync_verification
after insert or update or delete on public.credentials
for each row execute function private.sync_worker_verification();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text;
  safe_role public.user_role;
  worker_trade text;
  company text;
begin
  requested := coalesce(new.raw_user_meta_data ->> 'role', 'worker');
  if requested = 'employer' then
    safe_role := 'employer';
  else
    -- Never honor admin (or any other value) from user-editable metadata.
    safe_role := 'worker';
  end if;

  insert into public.profiles (id, role, full_name, city, state)
  values (
    new.id,
    safe_role,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(btrim(new.raw_user_meta_data ->> 'city'), ''),
    nullif(upper(btrim(new.raw_user_meta_data ->> 'state')), '')
  );

  if safe_role = 'worker' then
    worker_trade := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'trade'), ''), 'Construction');
    if worker_trade not in (
      'HVAC', 'Plumbing', 'Electrical', 'Welding', 'Carpentry', 'Mechanics', 'Construction'
    ) then
      worker_trade := 'Construction';
    end if;
    insert into public.worker_profiles (profile_id, trade)
    values (new.id, worker_trade);
  else
    company := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'company_name'), ''), 'Independent');
    insert into public.employer_profiles (profile_id, company_name)
    values (new.id, company);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

revoke all on function private.touch_updated_at() from public;
revoke all on function private.current_role() from public;
revoke all on function private.is_job_employer(uuid) from public;
revoke all on function private.has_applied(uuid) from public;
revoke all on function private.job_is_open(uuid) from public;
revoke all on function private.protect_profile_role() from public;
revoke all on function private.sync_worker_verification() from public;
revoke all on function private.handle_new_user() from public;

grant execute on function private.current_role() to authenticated;
grant execute on function private.is_job_employer(uuid) to authenticated;
grant execute on function private.has_applied(uuid) to authenticated;
grant execute on function private.job_is_open(uuid) to authenticated;

create or replace function public.search_workers(
  trade_filter text default null,
  certification_filter text default null,
  city_filter text default null,
  state_filter text default null
)
returns table (
  id uuid,
  full_name text,
  city text,
  state text,
  headline text,
  bio text,
  trade text,
  years_experience integer,
  hourly_rate numeric,
  open_to_work boolean,
  verification_status public.verification_status,
  approved_credentials text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.city,
    p.state,
    p.headline,
    p.bio,
    w.trade,
    w.years_experience,
    w.hourly_rate,
    w.open_to_work,
    w.verification_status,
    coalesce(
      (
        select array_agg(c.name order by c.name)
        from public.credentials c
        where c.worker_id = w.profile_id
          and c.status = 'approved'
      ),
      '{}'::text[]
    ) as approved_credentials
  from public.worker_profiles w
  join public.profiles p on p.id = w.profile_id
  where
    (trade_filter is null or trade_filter = '' or w.trade = trade_filter)
    and (state_filter is null or state_filter = '' or p.state = state_filter)
    and (
      city_filter is null
      or city_filter = ''
      or p.city ilike '%' || city_filter || '%'
    )
    and (
      certification_filter is null
      or certification_filter = ''
      or exists (
        select 1
        from public.credentials c
        where c.worker_id = w.profile_id
          and c.status = 'approved'
          and c.name ilike '%' || certification_filter || '%'
      )
    )
  order by (w.verification_status = 'verified') desc, p.full_name asc;
$$;

revoke all on function public.search_workers(text, text, text, text) from public;
grant execute on function public.search_workers(text, text, text, text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.credentials enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.worker_profiles from anon, authenticated;
revoke all on table public.employer_profiles from anon, authenticated;
revoke all on table public.credentials from anon, authenticated;
revoke all on table public.portfolio_items from anon, authenticated;
revoke all on table public.jobs from anon, authenticated;
revoke all on table public.applications from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update (full_name, city, state, headline, bio) on public.profiles to authenticated;

grant select on public.worker_profiles to anon, authenticated;
grant update (trade, years_experience, hourly_rate, open_to_work)
  on public.worker_profiles to authenticated;

grant select on public.employer_profiles to anon, authenticated;
grant update (company_name, website) on public.employer_profiles to authenticated;

grant select on public.credentials to anon, authenticated;
grant insert (
  worker_id, kind, name, issuing_authority, license_number, state,
  issued_on, expires_on, document_path, status
) on public.credentials to authenticated;
grant update (status, review_note, reviewed_at) on public.credentials to authenticated;
grant delete on public.credentials to authenticated;

grant select on public.portfolio_items to anon, authenticated;
grant insert (worker_id, title, description, image_path, completed_on)
  on public.portfolio_items to authenticated;
grant delete on public.portfolio_items to authenticated;

grant select on public.jobs to anon, authenticated;
grant insert (
  employer_id, title, trade, description, city, state, employment_type,
  pay_min, pay_max, pay_unit, required_certification, status
) on public.jobs to authenticated;
grant update (
  title, trade, description, city, state, employment_type,
  pay_min, pay_max, pay_unit, required_certification, status
) on public.jobs to authenticated;
grant delete on public.jobs to authenticated;

grant select on public.applications to authenticated;
grant insert (job_id, worker_id, cover_note, status) on public.applications to authenticated;
grant update (status) on public.applications to authenticated;
grant delete on public.applications to authenticated;

create policy profiles_select on public.profiles
for select to anon, authenticated
using (true);

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
);

create policy worker_profiles_select on public.worker_profiles
for select to anon, authenticated
using (true);

create policy worker_profiles_update_own on public.worker_profiles
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy employer_profiles_select on public.employer_profiles
for select to anon, authenticated
using (true);

create policy employer_profiles_update_own on public.employer_profiles
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy credentials_public_approved on public.credentials
for select to anon
using (status = 'approved');

create policy credentials_select_authenticated on public.credentials
for select to authenticated
using (
  status = 'approved'
  or worker_id = (select auth.uid())
  or (select private.current_role()) = 'admin'
);

create policy credentials_insert_own on public.credentials
for insert to authenticated
with check (
  worker_id = (select auth.uid())
  and (select private.current_role()) = 'worker'
  and status = 'pending'
);

create policy credentials_admin_review on public.credentials
for update to authenticated
using ((select private.current_role()) = 'admin')
with check ((select private.current_role()) = 'admin');

create policy credentials_delete on public.credentials
for delete to authenticated
using (
  (worker_id = (select auth.uid()) and status = 'pending')
  or (select private.current_role()) = 'admin'
);

create policy portfolio_select on public.portfolio_items
for select to anon, authenticated
using (true);

create policy portfolio_insert_own on public.portfolio_items
for insert to authenticated
with check (
  worker_id = (select auth.uid())
  and (select private.current_role()) = 'worker'
);

create policy portfolio_delete_own on public.portfolio_items
for delete to authenticated
using (
  worker_id = (select auth.uid())
  or (select private.current_role()) = 'admin'
);

create policy jobs_public_open on public.jobs
for select to anon
using (status = 'open');

create policy jobs_select_authenticated on public.jobs
for select to authenticated
using (
  status = 'open'
  or employer_id = (select auth.uid())
  or (select private.current_role()) = 'admin'
  or (select private.has_applied(id))
);

create policy jobs_insert_own on public.jobs
for insert to authenticated
with check (
  employer_id = (select auth.uid())
  and (select private.current_role()) = 'employer'
  and status = 'open'
);

create policy jobs_update_own on public.jobs
for update to authenticated
using (employer_id = (select auth.uid()))
with check (employer_id = (select auth.uid()));

create policy jobs_delete_own on public.jobs
for delete to authenticated
using (
  employer_id = (select auth.uid())
  or (select private.current_role()) = 'admin'
);

create policy applications_select on public.applications
for select to authenticated
using (
  worker_id = (select auth.uid())
  or (select private.current_role()) = 'admin'
  or (select private.is_job_employer(job_id))
);

create policy applications_insert_own on public.applications
for insert to authenticated
with check (
  worker_id = (select auth.uid())
  and (select private.current_role()) = 'worker'
  and status = 'submitted'
  and (select private.job_is_open(job_id))
);

create policy applications_employer_update on public.applications
for update to authenticated
using (
  (select private.is_job_employer(job_id))
  or (select private.current_role()) = 'admin'
)
with check (
  (select private.is_job_employer(job_id))
  or (select private.current_role()) = 'admin'
);

create policy applications_withdraw on public.applications
for delete to authenticated
using (
  worker_id = (select auth.uid())
  and status = 'submitted'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'credentials',
    'credentials',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'portfolio',
    'portfolio',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  );

create policy credentials_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'credentials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy credentials_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'credentials'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.current_role()) = 'admin'
  )
);

create policy credentials_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'credentials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'credentials'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy credentials_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'credentials'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.current_role()) = 'admin'
  )
);

create policy portfolio_storage_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'portfolio');

create policy portfolio_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'portfolio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy portfolio_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'portfolio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'portfolio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy portfolio_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'portfolio'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.current_role()) = 'admin'
  )
);
