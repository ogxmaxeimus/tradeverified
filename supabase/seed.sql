-- Pilot demo accounts. Password for every account: pilot-demo-2026
-- Do not run this file on a production database.

create temporary table seed_users (
  id uuid primary key,
  email text not null,
  meta jsonb not null
);

insert into seed_users (id, email, meta)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'avery.quinn@tradeverified.dev',
    '{"first_name":"Avery","last_name":"Quinn","role":"tradesperson","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'marcus.hale@tradeverified.dev',
    '{"first_name":"Marcus","last_name":"Hale","role":"employer","company_name":"Heartland Mechanical","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'priya.shah@tradeverified.dev',
    '{"first_name":"Priya","last_name":"Shah","role":"employer","company_name":"Lone Star Homes","city":"Dallas","state":"TX"}'::jsonb
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'jordan.ellis@tradeverified.dev',
    '{"first_name":"Jordan","last_name":"Ellis","role":"tradesperson","trade":"hvac","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'sam.rivera@tradeverified.dev',
    '{"first_name":"Sam","last_name":"Rivera","role":"tradesperson","trade":"electrical","city":"Houston","state":"TX"}'::jsonb
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'alex.nguyen@tradeverified.dev',
    '{"first_name":"Alex","last_name":"Nguyen","role":"tradesperson","trade":"plumbing","city":"Dallas","state":"TX"}'::jsonb
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'riley.brooks@tradeverified.dev',
    '{"first_name":"Riley","last_name":"Brooks","role":"tradesperson","trade":"welding","city":"San Antonio","state":"TX"}'::jsonb
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    'casey.morgan@tradeverified.dev',
    '{"first_name":"Casey","last_name":"Morgan","role":"tradesperson","trade":"carpentry","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '99999999-9999-4999-8999-999999999999',
    'drew.patel@tradeverified.dev',
    '{"first_name":"Drew","last_name":"Patel","role":"tradesperson","trade":"mechanics","city":"Fort Worth","state":"TX"}'::jsonb
  );

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  reauthentication_token,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000',
  s.id,
  'authenticated',
  'authenticated',
  s.email,
  extensions.crypt('pilot-demo-2026', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  s.meta,
  now(),
  now(),
  'ct-' || s.id::text,
  'rt-' || s.id::text,
  '',
  'ecn-' || s.id::text,
  'ecc-' || s.id::text,
  're-' || s.id::text,
  false,
  false
from seed_users s;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  s.id,
  s.id,
  jsonb_build_object('sub', s.id::text, 'email', s.email, 'email_verified', true),
  'email',
  s.id::text,
  now(),
  now(),
  now()
from seed_users s;

-- The signup trigger refuses admin from metadata. Promote Avery after the row exists.
update public.profiles
set role = 'admin',
    bio = 'Reviews license and certification uploads for the TradeVerified pilot.'
where id = '11111111-1111-4111-8111-111111111111';

delete from public.tradesperson_profiles
where user_id = '11111111-1111-4111-8111-111111111111';

update public.profiles set
  bio = 'Heartland Mechanical installs and services commercial and residential HVAC. We hire licensed techs who can document their credentials.',
  is_featured = false
where id = '22222222-2222-4222-8222-222222222222';

update public.companies set
  name = 'Heartland Mechanical',
  description = 'Commercial and residential HVAC contractor in central Texas.',
  website = 'https://example.com/heartland',
  industry = 'HVAC',
  size = '11-50',
  city = 'Austin',
  state = 'TX',
  email = 'marcus.hale@tradeverified.dev'
where owner_id = '22222222-2222-4222-8222-222222222222';

update public.profiles set
  bio = 'Lone Star Homes builds production homes in North Texas and keeps a bench of electricians, carpenters, and site leads.'
where id = '33333333-3333-4333-8333-333333333333';

update public.companies set
  name = 'Lone Star Homes',
  description = 'Production home builder hiring verified trades.',
  website = 'https://example.com/lonestar',
  industry = 'Residential construction',
  size = '51-200',
  city = 'Dallas',
  state = 'TX',
  email = 'priya.shah@tradeverified.dev'
where owner_id = '33333333-3333-4333-8333-333333333333';

update public.profiles set
  bio = 'Twelve years on residential and light commercial systems around Austin. Comfort installs, changeouts, and service calls.',
  is_featured = true
where id = '44444444-4444-4444-8444-444444444444';

update public.tradesperson_profiles set
  trade = 'hvac',
  years_experience = 12,
  hourly_rate = 42,
  availability = 'available',
  headline = 'HVAC technician, heat pumps and refrigeration'
where user_id = '44444444-4444-4444-8444-444444444444';

update public.profiles set
  bio = 'Panel upgrades, new construction rough-in, and troubleshooting. Based in Houston.'
where id = '55555555-5555-4555-8555-555555555555';

update public.tradesperson_profiles set
  trade = 'electrical',
  years_experience = 9,
  hourly_rate = 48,
  availability = 'available',
  headline = 'Journeyman electrician, residential and light commercial'
where user_id = '55555555-5555-4555-8555-555555555555';

update public.profiles set
  bio = 'Service plumbing and water heater replacements in Dallas. License upload is in review.'
where id = '66666666-6666-4666-8666-666666666666';

update public.tradesperson_profiles set
  trade = 'plumbing',
  years_experience = 6,
  hourly_rate = 38,
  availability = 'available',
  headline = 'Plumber waiting on license review'
where user_id = '66666666-6666-4666-8666-666666666666';

update public.profiles set
  bio = 'Shop and field welding. Profile is live, credentials not submitted yet.'
where id = '77777777-7777-4777-8777-777777777777';

update public.tradesperson_profiles set
  trade = 'welding',
  years_experience = 15,
  hourly_rate = 55,
  availability = 'available',
  headline = 'Structural and pipe welder'
where user_id = '77777777-7777-4777-8777-777777777777';

update public.profiles set
  bio = 'Decks, interior trim, and remodel framing in the Austin area.'
where id = '88888888-8888-4888-8888-888888888888';

update public.tradesperson_profiles set
  trade = 'carpentry',
  years_experience = 8,
  hourly_rate = 36,
  availability = 'available',
  headline = 'Finish and framing carpenter'
where user_id = '88888888-8888-4888-8888-888888888888';

update public.profiles set
  bio = 'Diagnostics and repair for light-duty vehicles. Shop experience in Fort Worth.'
where id = '99999999-9999-4999-8999-999999999999';

update public.tradesperson_profiles set
  trade = 'mechanics',
  years_experience = 11,
  hourly_rate = 40,
  availability = 'busy',
  headline = 'ASE-certified auto technician'
where user_id = '99999999-9999-4999-8999-999999999999';

insert into public.tradesperson_certifications (
  id,
  tradesperson_id,
  certification_id,
  credential_id,
  license_number,
  issuing_state,
  issue_date,
  expiry_date,
  status,
  verification_method,
  verification_notes,
  verified_by,
  verified_at
)
select
  v.id,
  tp.id,
  c.id,
  v.credential_id,
  v.license_number,
  v.issuing_state,
  v.issue_date,
  v.expiry_date,
  v.status::public.certification_status,
  v.method::public.verification_method,
  v.notes,
  case when v.status = 'verified' then '11111111-1111-4111-8111-111111111111'::uuid else null end,
  case when v.status = 'verified' then now() else null end
from (
  values
    (
      'c4444444-4444-4444-8444-444444444441'::uuid,
      '44444444-4444-4444-8444-444444444444'::uuid,
      'EPA 608 Certification',
      'EPA608-44192',
      'EPA608-44192',
      'TX',
      '2022-04-12'::date,
      null::date,
      'verified',
      'document_review',
      'Checked against the uploaded card during pilot review.'
    ),
    (
      'c4444444-4444-4444-8444-444444444442'::uuid,
      '44444444-4444-4444-8444-444444444444'::uuid,
      'NATE Certification',
      'NATE-22910',
      'NATE-22910',
      null,
      '2023-06-01'::date,
      '2026-06-01'::date,
      'verified',
      'issuer_portal',
      'Issuing body listed on the certificate.'
    ),
    (
      'c5555555-5555-4555-8555-555555555551'::uuid,
      '55555555-5555-4555-8555-555555555555'::uuid,
      'Journeyman Electrician',
      'EC13001234',
      'EC13001234',
      'TX',
      '2021-09-15'::date,
      '2027-09-15'::date,
      'verified',
      'state_license_board',
      'License number and state recorded for manual review.'
    ),
    (
      'c6666666-6666-4666-8666-666666666661'::uuid,
      '66666666-6666-4666-8666-666666666666'::uuid,
      'Journeyman Plumber',
      'PL-55821',
      'PL-55821',
      'TX',
      '2024-02-01'::date,
      '2027-02-01'::date,
      'pending',
      null,
      null
    ),
    (
      'c8888888-8888-4888-8888-888888888881'::uuid,
      '88888888-8888-4888-8888-888888888888'::uuid,
      'OSHA 30',
      'OSHA30-18823',
      'OSHA30-18823',
      null,
      '2024-11-03'::date,
      null::date,
      'verified',
      'document_review',
      'Card photo accepted in pilot review.'
    ),
    (
      'c9999999-9999-4999-8999-999999999991'::uuid,
      '99999999-9999-4999-8999-999999999999'::uuid,
      'ASE Certification',
      'ASE-A44821',
      'ASE-A44821',
      null,
      '2023-01-20'::date,
      '2028-01-20'::date,
      'verified',
      'issuer_portal',
      'ASE certificate accepted in pilot review.'
    )
) as v (
  id, user_id, cert_name, credential_id, license_number, issuing_state,
  issue_date, expiry_date, status, method, notes
)
join public.tradesperson_profiles tp on tp.user_id = v.user_id
join public.certifications c on c.name = v.cert_name;

insert into public.certification_verification_events (
  tradesperson_certification_id,
  actor_id,
  action,
  method,
  notes
)
select
  tc.id,
  '11111111-1111-4111-8111-111111111111',
  'verified',
  tc.verification_method,
  tc.verification_notes
from public.tradesperson_certifications tc
where tc.status = 'verified';

insert into public.certification_verification_events (
  tradesperson_certification_id,
  actor_id,
  action,
  notes
)
values (
  'c6666666-6666-4666-8666-666666666661',
  '66666666-6666-4666-8666-666666666666',
  'submitted',
  'Texas plumber license waiting on admin review.'
);

insert into public.portfolio_items (id, tradesperson_id, title, description, image_url, trade, completed_at)
select
  v.id,
  tp.id,
  v.title,
  v.description,
  v.image_url,
  v.trade::public.trade_type,
  v.completed_at
from (
  values
    ('d4444444-4444-4444-8444-444444444441'::uuid, '44444444-4444-4444-8444-444444444444'::uuid, 'Heat pump changeout', 'Replaced a failing split system with a 3-ton heat pump in South Austin.', '/seed/hvac.svg', 'hvac', '2026-03-18'::date),
    ('d5555555-5555-4555-8555-555555555551'::uuid, '55555555-5555-4555-8555-555555555555'::uuid, '200-amp panel upgrade', 'Service upgrade and labeling for a 1970s bungalow in Houston.', '/seed/electrical.svg', 'electrical', '2026-01-09'::date),
    ('d6666666-6666-4666-8666-666666666661'::uuid, '66666666-6666-4666-8666-666666666666'::uuid, 'Water heater replacement', '40-gallon gas water heater swap with new shutoffs.', '/seed/plumbing.svg', 'plumbing', '2025-11-02'::date),
    ('d7777777-7777-4777-8777-777777777771'::uuid, '77777777-7777-4777-8777-777777777777'::uuid, 'Structural weld repair', 'Field repair on a trailer frame. Credentials still to be submitted.', '/seed/welding.svg', 'welding', '2026-02-14'::date),
    ('d8888888-8888-4888-8888-888888888881'::uuid, '88888888-8888-4888-8888-888888888888'::uuid, 'Cedar deck frame', 'Framed and decked a 14 by 20 cedar platform.', '/seed/carpentry.svg', 'carpentry', '2025-08-22'::date),
    ('d9999999-9999-4999-8999-999999999991'::uuid, '99999999-9999-4999-8999-999999999999'::uuid, 'Brake and diagnostic job', 'Front brake service and charging-system diagnosis.', '/seed/mechanics.svg', 'mechanics', '2026-04-04'::date)
) as v (id, user_id, title, description, image_url, trade, completed_at)
join public.tradesperson_profiles tp on tp.user_id = v.user_id;

insert into public.jobs (
  id, company_id, posted_by, title, description, trade, job_type,
  city, state, salary_min, salary_max, hourly_rate_min, hourly_rate_max,
  required_certifications, required_experience, status, applications_count
)
select
  v.id,
  co.id,
  v.owner_id,
  v.title,
  v.description,
  v.trade::public.trade_type,
  v.job_type,
  v.city,
  v.state,
  v.salary_min,
  v.salary_max,
  v.hourly_min,
  v.hourly_max,
  v.required_certifications,
  v.required_experience,
  'active',
  v.applications_count
from (
  values
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'HVAC Service Technician',
      'Run service calls, diagnose heat pumps and gas furnaces, and document EPA certification. Van and tablet provided. On-call rotation every fifth week.',
      'hvac',
      'full-time',
      'Austin',
      'TX',
      null::numeric,
      null::numeric,
      28::numeric,
      36::numeric,
      array['EPA 608 Certification'],
      3,
      1
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Journeyman Electrician',
      'Rough-in and trim for production homes. Must hold an active Texas journeyman license. Crews start at 7am.',
      'electrical',
      'full-time',
      'Dallas',
      'TX',
      null::numeric,
      null::numeric,
      32::numeric,
      45::numeric,
      array['Journeyman Electrician'],
      4,
      1
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Finish Carpenter',
      'Interior trim, doors, and punch-list carpentry on occupied and new homes. Contract through the end of the year with option to extend.',
      'carpentry',
      'contract',
      'Dallas',
      'TX',
      null::numeric,
      null::numeric,
      30::numeric,
      40::numeric,
      null::text[],
      2,
      1
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'Plumber, new construction',
      'Top-out and trim plumbing on custom homes west of Houston. Contract role, 4-day weeks.',
      'plumbing',
      'contract',
      'Houston',
      'TX',
      null::numeric,
      null::numeric,
      30::numeric,
      42::numeric,
      null::text[],
      3,
      0
    ),
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5'::uuid,
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Construction Site Lead',
      'Coordinate subs and daily safety walks on two active subdivisions. OSHA 30 preferred.',
      'construction',
      'full-time',
      'Dallas',
      'TX',
      70000::numeric,
      85000::numeric,
      null::numeric,
      null::numeric,
      array['OSHA 30'],
      5,
      0
    )
) as v (
  id, owner_id, title, description, trade, job_type, city, state,
  salary_min, salary_max, hourly_min, hourly_max, required_certifications,
  required_experience, applications_count
)
join public.companies co on co.owner_id = v.owner_id;

insert into public.job_applications (id, job_id, tradesperson_id, cover_letter, status)
select v.id, v.job_id, tp.id, v.cover_letter, v.status::public.application_status
from (
  values
    (
      'b4444444-4444-4444-8444-444444444441'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
      '44444444-4444-4444-8444-444444444444'::uuid,
      'EPA 608 and NATE are both on my profile. I can start service calls in Austin next Monday.',
      'pending'
    ),
    (
      'b5555555-5555-4555-8555-555555555551'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
      '55555555-5555-4555-8555-555555555555'::uuid,
      'Active Texas journeyman license EC13001234. Open to Dallas production work.',
      'reviewed'
    ),
    (
      'b8888888-8888-4888-8888-888888888881'::uuid,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid,
      '88888888-8888-4888-8888-888888888888'::uuid,
      'Finish carpentry is most of my recent work. I have OSHA 30 on file.',
      'pending'
    )
) as v (id, job_id, user_id, cover_letter, status)
join public.tradesperson_profiles tp on tp.user_id = v.user_id;
