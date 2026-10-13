-- Harden the owner schema without dropping its tables.
-- Signup metadata cannot grant admin. Tradespeople cannot change verification
-- fields. Security-definer helpers live in private, outside the Data API.
-- auth.uid() is wrapped in a scalar subquery so policies stay init-plan friendly.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.owns_tradesperson(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tradesperson_profiles
    where id = target
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.is_job_poster(target_job uuid)
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
      and posted_by = (select auth.uid())
  );
$$;

create or replace function private.job_is_active(target_job uuid)
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
      and status = 'active'
  );
$$;

create or replace function private.trusted_write()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(pg_catalog.current_setting('private.trusted_write', true), '') = 'on';
$$;

revoke all on function private.current_role() from public;
revoke all on function private.owns_tradesperson(uuid) from public;
revoke all on function private.is_job_poster(uuid) from public;
revoke all on function private.job_is_active(uuid) from public;
revoke all on function private.trusted_write() from public;

grant execute on function private.current_role() to authenticated;
grant execute on function private.owns_tradesperson(uuid) to authenticated;
grant execute on function private.is_job_poster(uuid) to authenticated;
grant execute on function private.job_is_active(uuid) to authenticated;
grant execute on function private.trusted_write() to authenticated;

-- ---------------------------------------------------------------------------
-- Signup: never honor admin from user-editable metadata
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text;
  safe_role public.user_role;
  requested_trade text;
  safe_trade public.trade_type;
  company_name text;
begin
  requested := pg_catalog.lower(coalesce(new.raw_user_meta_data ->> 'role', 'tradesperson'));
  if requested = 'employer' then
    safe_role := 'employer';
  else
    -- admin, tradesperson, worker, or anything else becomes a tradesperson.
    safe_role := 'tradesperson';
  end if;

  insert into public.profiles (id, email, role, first_name, last_name, city, state)
  values (
    new.id,
    coalesce(new.email, ''),
    safe_role,
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'city'), ''),
    nullif(pg_catalog.upper(pg_catalog.btrim(new.raw_user_meta_data ->> 'state')), '')
  );

  if safe_role = 'tradesperson' then
    requested_trade := pg_catalog.lower(coalesce(new.raw_user_meta_data ->> 'trade', 'construction'));
    if requested_trade in (
      'hvac', 'plumbing', 'electrical', 'welding', 'carpentry', 'mechanics', 'construction', 'other'
    ) then
      safe_trade := requested_trade::public.trade_type;
    else
      safe_trade := 'construction';
    end if;

    insert into public.tradesperson_profiles (user_id, trade)
    values (new.id, safe_trade);
  else
    company_name := coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'company_name'), ''),
      'Independent'
    );
    insert into public.companies (owner_id, name, city, state)
    values (
      new.id,
      company_name,
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'city'), ''),
      nullif(pg_catalog.upper(pg_catalog.btrim(new.raw_user_meta_data ->> 'state')), '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

revoke all on function private.handle_new_user() from public;

-- ---------------------------------------------------------------------------
-- Privileged columns and verification badge
-- ---------------------------------------------------------------------------

create or replace function private.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.trusted_write() or (select auth.uid()) is null then
    return new;
  end if;

  if (select private.current_role()) = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.is_verified is distinct from old.is_verified
    or new.is_featured is distinct from old.is_featured
    or new.subscription_tier is distinct from old.subscription_tier
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.profile_views is distinct from old.profile_views
  then
    raise exception 'privileged profile fields cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function private.protect_profile_fields();

create or replace function private.protect_certification_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select private.current_role()) = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.verified_by := null;
    new.verified_at := null;
    new.verification_method := null;
    new.verification_source_url := null;
    new.verification_reference := null;
    new.verification_notes := null;
    new.rejection_reason := null;
    return new;
  end if;

  if new.status is distinct from old.status
    or new.verified_by is distinct from old.verified_by
    or new.verified_at is distinct from old.verified_at
    or new.verification_method is distinct from old.verification_method
    or new.verification_source_url is distinct from old.verification_source_url
    or new.verification_reference is distinct from old.verification_reference
    or new.verification_notes is distinct from old.verification_notes
    or new.rejection_reason is distinct from old.rejection_reason
  then
    raise exception 'only an admin can change verification status';
  end if;

  return new;
end;
$$;

drop trigger if exists tradesperson_certifications_protect_review on public.tradesperson_certifications;
create trigger tradesperson_certifications_protect_review
  before insert or update on public.tradesperson_certifications
  for each row execute function private.protect_certification_review();

create or replace function private.sync_verification_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  verified boolean;
begin
  perform pg_catalog.set_config('private.trusted_write', 'on', true);

  select user_id into uid
  from public.tradesperson_profiles
  where id = coalesce(new.tradesperson_id, old.tradesperson_id);

  if uid is null then
    return coalesce(new, old);
  end if;

  verified := exists (
    select 1
    from public.tradesperson_certifications tc
    join public.tradesperson_profiles tp on tp.id = tc.tradesperson_id
    where tp.user_id = uid
      and tc.status = 'verified'
  );

  update public.profiles
  set is_verified = verified
  where id = uid
    and is_verified is distinct from verified;

  return coalesce(new, old);
end;
$$;

drop trigger if exists tradesperson_certifications_sync_badge on public.tradesperson_certifications;
create trigger tradesperson_certifications_sync_badge
  after insert or update or delete on public.tradesperson_certifications
  for each row execute function private.sync_verification_badge();

create or replace function private.protect_review_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select private.current_role()) = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.is_public := false;
    new.moderated_by := null;
    new.moderated_at := null;
    return new;
  end if;

  if new.status is distinct from old.status
    or new.is_public is distinct from old.is_public
    or new.moderated_by is distinct from old.moderated_by
  then
    raise exception 'only an admin can moderate reviews';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_protect_moderation on public.reviews;
create trigger reviews_protect_moderation
  before insert or update on public.reviews
  for each row execute function private.protect_review_moderation();

revoke all on function private.protect_profile_fields() from public;
revoke all on function private.protect_certification_review() from public;
revoke all on function private.sync_verification_badge() from public;
revoke all on function private.protect_review_moderation() from public;

-- ---------------------------------------------------------------------------
-- Callable counters stay in public, but as invokers over private definers
-- ---------------------------------------------------------------------------

drop function if exists public.increment_profile_views(uuid);
drop function if exists public.increment_applications_count(uuid);
drop function if exists public.expire_certifications();

create or replace function private.increment_profile_views(profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.set_config('private.trusted_write', 'on', true);
  update public.profiles
  set profile_views = profile_views + 1
  where id = profile_id;
end;
$$;

create or replace function public.increment_profile_views(profile_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.increment_profile_views(profile_id);
end;
$$;

create or replace function private.increment_applications_count(job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
  set applications_count = applications_count + 1
  where id = job_id;
end;
$$;

create or replace function public.increment_applications_count(job_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.increment_applications_count(job_id);
end;
$$;

create or replace function private.expire_certifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tradesperson_certifications
  set status = 'expired'
  where expiry_date is not null
    and expiry_date < pg_catalog.current_date
    and status <> 'expired';
end;
$$;

revoke all on function private.increment_profile_views(uuid) from public;
revoke all on function private.increment_applications_count(uuid) from public;
revoke all on function private.expire_certifications() from public;
grant execute on function private.increment_profile_views(uuid) to authenticated, anon;
grant execute on function private.increment_applications_count(uuid) to authenticated;

revoke all on function public.increment_profile_views(uuid) from public;
revoke all on function public.increment_applications_count(uuid) from public;
grant execute on function public.increment_profile_views(uuid) to anon, authenticated;
grant execute on function public.increment_applications_count(uuid) to authenticated;

-- Anon profile-view counting needs to execute the private helper.
grant usage on schema private to anon;
revoke all on function private.current_role() from anon;
revoke all on function private.owns_tradesperson(uuid) from anon;
revoke all on function private.is_job_poster(uuid) from anon;
revoke all on function private.job_is_active(uuid) from anon;
revoke all on function private.handle_new_user() from anon;
revoke all on function private.protect_profile_fields() from anon;
revoke all on function private.protect_certification_review() from anon;
revoke all on function private.sync_verification_badge() from anon;
revoke all on function private.protect_review_moderation() from anon;
revoke all on function private.expire_certifications() from anon;
revoke all on function private.increment_applications_count(uuid) from anon;

-- ---------------------------------------------------------------------------
-- Search: trade, verified certification, city, and state in the database
-- ---------------------------------------------------------------------------

create or replace function public.search_workers(
  trade_filter text default null,
  certification_filter text default null,
  city_filter text default null,
  state_filter text default null
)
returns table (
  id uuid,
  user_id uuid,
  trade public.trade_type,
  years_experience integer,
  hourly_rate numeric,
  availability text,
  headline text,
  first_name text,
  last_name text,
  city text,
  state text,
  avatar_url text,
  is_verified boolean,
  is_featured boolean,
  bio text,
  approved_certifications text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    tp.id,
    tp.user_id,
    tp.trade,
    case when tp.years_experience is null then 0 else tp.years_experience end,
    tp.hourly_rate,
    case when tp.availability is null then 'available' else tp.availability end,
    tp.headline,
    p.first_name,
    p.last_name,
    p.city,
    p.state,
    p.avatar_url,
    p.is_verified,
    p.is_featured,
    p.bio,
    (
      select coalesce(array_agg(c.name order by c.name), '{}'::text[])
      from public.tradesperson_certifications tc
      join public.certifications c on c.id = tc.certification_id
      where tc.tradesperson_id = tp.id
        and tc.status = 'verified'
    )
  from public.tradesperson_profiles tp
  join public.profiles p on p.id = tp.user_id
  where
    (
      trade_filter is null
      or trade_filter = ''
      or tp.trade::text = pg_catalog.lower(trade_filter)
    )
    and (
      state_filter is null
      or state_filter = ''
      or p.state = state_filter
    )
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
        from public.tradesperson_certifications tc
        join public.certifications c on c.id = tc.certification_id
        where tc.tradesperson_id = tp.id
          and tc.status = 'verified'
          and c.name ilike '%' || certification_filter || '%'
      )
    )
  order by p.is_featured desc, p.is_verified desc, p.first_name asc nulls last;
$$;

revoke all on function public.search_workers(text, text, text, text) from public;
grant execute on function public.search_workers(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Replace recursive and overly broad policies
-- ---------------------------------------------------------------------------

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Tradesperson profiles viewable by everyone" on public.tradesperson_profiles;
drop policy if exists "Tradespeople can manage own profile" on public.tradesperson_profiles;
drop policy if exists "Companies viewable by everyone" on public.companies;
drop policy if exists "Employers can manage own company" on public.companies;
drop policy if exists "Skills viewable by everyone" on public.skills;
drop policy if exists "Tradesperson skills viewable" on public.tradesperson_skills;
drop policy if exists "Tradespeople manage own skills" on public.tradesperson_skills;
drop policy if exists "Work history viewable" on public.work_history;
drop policy if exists "Tradespeople manage own work history" on public.work_history;
drop policy if exists "Certifications viewable" on public.certifications;
drop policy if exists "Tradesperson certs viewable" on public.tradesperson_certifications;
drop policy if exists "Tradespeople manage own certs" on public.tradesperson_certifications;
drop policy if exists "Admins manage all certs" on public.tradesperson_certifications;
drop policy if exists "Portfolio viewable" on public.portfolio_items;
drop policy if exists "Tradespeople manage own portfolio" on public.portfolio_items;
drop policy if exists "Active jobs viewable" on public.jobs;
drop policy if exists "Employers manage own jobs" on public.jobs;
drop policy if exists "Applicants see own applications" on public.job_applications;
drop policy if exists "Tradespeople can apply" on public.job_applications;
drop policy if exists "Employers update application status" on public.job_applications;
drop policy if exists "Users manage own saved jobs" on public.saved_jobs;
drop policy if exists "Employers manage saved candidates" on public.saved_candidates;
drop policy if exists "Approved reviews public" on public.reviews;
drop policy if exists "Users can submit reviews" on public.reviews;
drop policy if exists "Admins moderate reviews" on public.reviews;
drop policy if exists "Users see own messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users see own subscriptions" on public.subscriptions;
drop policy if exists "Users see own analytics" on public.analytics_events;
drop policy if exists "Anyone can log events" on public.analytics_events;
drop policy if exists "Profile views insertable" on public.profile_views;
drop policy if exists "Profile owners see views" on public.profile_views;
drop policy if exists "Verification events viewable" on public.certification_verification_events;
drop policy if exists "Admins write verification events" on public.certification_verification_events;

create policy profiles_select on public.profiles
  for select using (true);
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.current_role()) = 'admin')
  with check (id = (select auth.uid()) or (select private.current_role()) = 'admin');

create policy tradesperson_select on public.tradesperson_profiles
  for select using (true);
create policy tradesperson_insert_own on public.tradesperson_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy tradesperson_update_own on public.tradesperson_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or (select private.current_role()) = 'admin')
  with check (user_id = (select auth.uid()) or (select private.current_role()) = 'admin');
create policy tradesperson_delete_own on public.tradesperson_profiles
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.current_role()) = 'admin');

create policy companies_select on public.companies
  for select using (true);
create policy companies_insert_own on public.companies
  for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy companies_update_own on public.companies
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.current_role()) = 'admin')
  with check (owner_id = (select auth.uid()) or (select private.current_role()) = 'admin');
create policy companies_delete_own on public.companies
  for delete to authenticated
  using (owner_id = (select auth.uid()) or (select private.current_role()) = 'admin');

create policy skills_select on public.skills
  for select using (true);
create policy certifications_select on public.certifications
  for select using (true);

create policy tradesperson_skills_select on public.tradesperson_skills
  for select using (true);
create policy tradesperson_skills_insert on public.tradesperson_skills
  for insert to authenticated
  with check ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');
create policy tradesperson_skills_update on public.tradesperson_skills
  for update to authenticated
  using ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin')
  with check ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');
create policy tradesperson_skills_delete on public.tradesperson_skills
  for delete to authenticated
  using ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');

create policy work_history_select on public.work_history
  for select using (true);
create policy work_history_insert on public.work_history
  for insert to authenticated
  with check ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');
create policy work_history_update on public.work_history
  for update to authenticated
  using ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin')
  with check ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');
create policy work_history_delete on public.work_history
  for delete to authenticated
  using ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');

-- Pending credentials stay private. The public sees verified rows only.
create policy certs_select_anon on public.tradesperson_certifications
  for select to anon
  using (status = 'verified');
create policy certs_select_auth on public.tradesperson_certifications
  for select to authenticated
  using (
    status = 'verified'
    or (select private.owns_tradesperson(tradesperson_id))
    or (select private.current_role()) = 'admin'
  );
create policy certs_insert_own on public.tradesperson_certifications
  for insert to authenticated
  with check ((select private.owns_tradesperson(tradesperson_id)));
create policy certs_update on public.tradesperson_certifications
  for update to authenticated
  using (
    (select private.owns_tradesperson(tradesperson_id))
    or (select private.current_role()) = 'admin'
  )
  with check (
    (select private.owns_tradesperson(tradesperson_id))
    or (select private.current_role()) = 'admin'
  );
create policy certs_delete on public.tradesperson_certifications
  for delete to authenticated
  using (
    (select private.owns_tradesperson(tradesperson_id))
    or (select private.current_role()) = 'admin'
  );

create policy portfolio_select on public.portfolio_items
  for select using (true);
create policy portfolio_insert on public.portfolio_items
  for insert to authenticated
  with check ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');
create policy portfolio_update on public.portfolio_items
  for update to authenticated
  using ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin')
  with check ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');
create policy portfolio_delete on public.portfolio_items
  for delete to authenticated
  using ((select private.owns_tradesperson(tradesperson_id)) or (select private.current_role()) = 'admin');

create policy jobs_select_anon on public.jobs
  for select to anon
  using (status = 'active');
create policy jobs_select_auth on public.jobs
  for select to authenticated
  using (
    status = 'active'
    or posted_by = (select auth.uid())
    or (select private.current_role()) = 'admin'
  );
create policy jobs_insert_own on public.jobs
  for insert to authenticated
  with check (posted_by = (select auth.uid()) or (select private.current_role()) = 'admin');
create policy jobs_update_own on public.jobs
  for update to authenticated
  using (posted_by = (select auth.uid()) or (select private.current_role()) = 'admin')
  with check (posted_by = (select auth.uid()) or (select private.current_role()) = 'admin');
create policy jobs_delete_own on public.jobs
  for delete to authenticated
  using (posted_by = (select auth.uid()) or (select private.current_role()) = 'admin');

create policy applications_select on public.job_applications
  for select to authenticated
  using (
    (select private.owns_tradesperson(tradesperson_id))
    or (select private.is_job_poster(job_id))
    or (select private.current_role()) = 'admin'
  );
create policy applications_insert on public.job_applications
  for insert to authenticated
  with check (
    (select private.owns_tradesperson(tradesperson_id))
    and (select private.job_is_active(job_id))
  );
create policy applications_update on public.job_applications
  for update to authenticated
  using (
    (select private.is_job_poster(job_id))
    or (select private.current_role()) = 'admin'
  )
  with check (
    (select private.is_job_poster(job_id))
    or (select private.current_role()) = 'admin'
  );
create policy applications_delete on public.job_applications
  for delete to authenticated
  using (
    (select private.owns_tradesperson(tradesperson_id))
    or (select private.is_job_poster(job_id))
    or (select private.current_role()) = 'admin'
  );

create policy saved_jobs_all on public.saved_jobs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy saved_candidates_all on public.saved_candidates
  for all to authenticated
  using (employer_id = (select auth.uid()) or (select private.current_role()) = 'admin')
  with check (employer_id = (select auth.uid()));

create policy reviews_select_anon on public.reviews
  for select to anon
  using (status = 'approved' and is_public = true);
create policy reviews_select_auth on public.reviews
  for select to authenticated
  using (
    (status = 'approved' and is_public = true)
    or reviewer_id = (select auth.uid())
    or (select private.owns_tradesperson(tradesperson_id))
    or (select private.current_role()) = 'admin'
  );
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (reviewer_id = (select auth.uid()));
create policy reviews_update_admin on public.reviews
  for update to authenticated
  using ((select private.current_role()) = 'admin')
  with check ((select private.current_role()) = 'admin');

create policy messages_select on public.messages
  for select to authenticated
  using (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or (select private.current_role()) = 'admin'
  );
create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()));
create policy messages_update_read on public.messages
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.current_role()) = 'admin');

create policy analytics_select on public.analytics_events
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.current_role()) = 'admin');
create policy analytics_insert on public.analytics_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create policy profile_views_insert on public.profile_views
  for insert to anon, authenticated
  with check (profile_id is not null);

alter function public.update_updated_at() set search_path = public;

-- Keep the trigram extension out of the exposed public schema.
alter extension pg_trgm set schema extensions;
create policy profile_views_select on public.profile_views
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select private.current_role()) = 'admin');

create policy verification_events_select_anon on public.certification_verification_events
  for select to anon
  using (
    exists (
      select 1
      from public.tradesperson_certifications tc
      where tc.id = tradesperson_certification_id
        and tc.status = 'verified'
    )
  );
create policy verification_events_select_auth on public.certification_verification_events
  for select to authenticated
  using (
    (select private.current_role()) = 'admin'
    or exists (
      select 1
      from public.tradesperson_certifications tc
      where tc.id = tradesperson_certification_id
        and (
          tc.status = 'verified'
          or (select private.owns_tradesperson(tc.tradesperson_id))
        )
    )
  );
create policy verification_events_insert_admin on public.certification_verification_events
  for insert to authenticated
  with check ((select private.current_role()) = 'admin');

-- ---------------------------------------------------------------------------
-- Storage: owner folder plus admin review. Upsert needs insert, select, update.
-- ---------------------------------------------------------------------------

drop policy if exists "Avatar uploads" on storage.objects;
drop policy if exists "Avatar public read" on storage.objects;
drop policy if exists "Portfolio uploads" on storage.objects;
drop policy if exists "Portfolio public read" on storage.objects;
drop policy if exists "Cert uploads" on storage.objects;
drop policy if exists "Cert owner read" on storage.objects;
drop policy if exists "Cert admin read" on storage.objects;
drop policy if exists "Logo uploads" on storage.objects;
drop policy if exists "Logo public read" on storage.objects;
drop policy if exists "Review proof uploads" on storage.objects;

create policy avatar_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy avatar_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy avatar_select on storage.objects
  for select using (bucket_id = 'avatars');

create policy portfolio_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy portfolio_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'portfolio'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy portfolio_select on storage.objects
  for select using (bucket_id = 'portfolio');

create policy cert_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'certifications'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy cert_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'certifications'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy cert_select_owner on storage.objects
  for select to authenticated
  using (
    bucket_id = 'certifications'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select private.current_role()) = 'admin'
    )
  );
create policy cert_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'certifications'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select private.current_role()) = 'admin'
    )
  );

create policy logo_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-logos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy logo_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-logos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy logo_select on storage.objects
  for select using (bucket_id = 'company-logos');

create policy review_proof_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-proofs'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy review_proof_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'review-proofs'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
create policy review_proof_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'review-proofs'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or (select private.current_role()) = 'admin'
    )
  );
