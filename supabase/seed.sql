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
    '{"full_name":"Avery Quinn","role":"admin","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'marcus.hale@tradeverified.dev',
    '{"full_name":"Marcus Hale","role":"employer","company_name":"Heartland Mechanical","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'priya.shah@tradeverified.dev',
    '{"full_name":"Priya Shah","role":"employer","company_name":"Lone Star Homes","city":"Dallas","state":"TX"}'::jsonb
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'jordan.ellis@tradeverified.dev',
    '{"full_name":"Jordan Ellis","role":"worker","trade":"HVAC","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'sam.rivera@tradeverified.dev',
    '{"full_name":"Sam Rivera","role":"worker","trade":"Electrical","city":"Houston","state":"TX"}'::jsonb
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'alex.nguyen@tradeverified.dev',
    '{"full_name":"Alex Nguyen","role":"worker","trade":"Plumbing","city":"Dallas","state":"TX"}'::jsonb
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'riley.brooks@tradeverified.dev',
    '{"full_name":"Riley Brooks","role":"worker","trade":"Welding","city":"San Antonio","state":"TX"}'::jsonb
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    'casey.morgan@tradeverified.dev',
    '{"full_name":"Casey Morgan","role":"worker","trade":"Carpentry","city":"Austin","state":"TX"}'::jsonb
  ),
  (
    '99999999-9999-4999-8999-999999999999',
    'drew.patel@tradeverified.dev',
    '{"full_name":"Drew Patel","role":"worker","trade":"Mechanics","city":"Fort Worth","state":"TX"}'::jsonb
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

update public.profiles
set
  role = 'admin',
  headline = 'Verification desk',
  bio = 'Reviews license and certification uploads for the TradeVerified pilot.'
where id = '11111111-1111-4111-8111-111111111111';

delete from public.worker_profiles
where profile_id = '11111111-1111-4111-8111-111111111111';

update public.profiles set
  headline = 'Hiring HVAC techs across central Texas',
  bio = 'Heartland Mechanical installs and services commercial and residential HVAC. We hire licensed techs who can document their credentials.'
where id = '22222222-2222-4222-8222-222222222222';

update public.employer_profiles set
  company_name = 'Heartland Mechanical',
  website = 'https://example.com/heartland'
where profile_id = '22222222-2222-4222-8222-222222222222';

update public.profiles set
  headline = 'Residential builder hiring verified trades',
  bio = 'Lone Star Homes builds production homes in North Texas and keeps a bench of electricians, carpenters, and site leads.'
where id = '33333333-3333-4333-8333-333333333333';

update public.employer_profiles set
  company_name = 'Lone Star Homes',
  website = 'https://example.com/lonestar'
where profile_id = '33333333-3333-4333-8333-333333333333';

update public.profiles set
  headline = 'HVAC technician, heat pumps and refrigeration',
  bio = 'Twelve years on residential and light commercial systems around Austin. Comfort installs, changeouts, and service calls.'
where id = '44444444-4444-4444-8444-444444444444';

update public.worker_profiles set
  trade = 'HVAC',
  years_experience = 12,
  hourly_rate = 42,
  open_to_work = true
where profile_id = '44444444-4444-4444-8444-444444444444';

update public.profiles set
  headline = 'Journeyman electrician, residential and light commercial',
  bio = 'Panel upgrades, new construction rough-in, and troubleshooting. Based in Houston.'
where id = '55555555-5555-4555-8555-555555555555';

update public.worker_profiles set
  trade = 'Electrical',
  years_experience = 9,
  hourly_rate = 48,
  open_to_work = true
where profile_id = '55555555-5555-4555-8555-555555555555';

update public.profiles set
  headline = 'Plumber waiting on license review',
  bio = 'Service plumbing and water heater replacements in Dallas. License upload is in review.'
where id = '66666666-6666-4666-8666-666666666666';

update public.worker_profiles set
  trade = 'Plumbing',
  years_experience = 6,
  hourly_rate = 38,
  open_to_work = true
where profile_id = '66666666-6666-4666-8666-666666666666';

update public.profiles set
  headline = 'Structural and pipe welder',
  bio = 'Shop and field welding. Profile is live, credentials not submitted yet.'
where id = '77777777-7777-4777-8777-777777777777';

update public.worker_profiles set
  trade = 'Welding',
  years_experience = 15,
  hourly_rate = 55,
  open_to_work = true
where profile_id = '77777777-7777-4777-8777-777777777777';

update public.profiles set
  headline = 'Finish and framing carpenter',
  bio = 'Decks, interior trim, and remodel framing in the Austin area.'
where id = '88888888-8888-4888-8888-888888888888';

update public.worker_profiles set
  trade = 'Carpentry',
  years_experience = 8,
  hourly_rate = 36,
  open_to_work = true
where profile_id = '88888888-8888-4888-8888-888888888888';

update public.profiles set
  headline = 'ASE-certified auto technician',
  bio = 'Diagnostics and repair for light-duty vehicles. Shop experience in Fort Worth.'
where id = '99999999-9999-4999-8999-999999999999';

update public.worker_profiles set
  trade = 'Mechanics',
  years_experience = 11,
  hourly_rate = 40,
  open_to_work = false
where profile_id = '99999999-9999-4999-8999-999999999999';

insert into public.credentials (
  id, worker_id, kind, name, issuing_authority, license_number, state,
  issued_on, expires_on, status, review_note, reviewed_at
)
values
  (
    'c4444444-4444-4444-8444-444444444441',
    '44444444-4444-4444-8444-444444444444',
    'certification',
    'EPA 608 Universal',
    'U.S. Environmental Protection Agency',
    'EPA608-44192',
    'TX',
    '2022-04-12',
    null,
    'approved',
    'Checked against the uploaded card during pilot review.',
    now()
  ),
  (
    'c4444444-4444-4444-8444-444444444442',
    '44444444-4444-4444-8444-444444444444',
    'certification',
    'NATE Air Conditioning',
    'North American Technician Excellence',
    'NATE-22910',
    null,
    '2023-06-01',
    '2026-06-01',
    'approved',
    'Issuing body listed on the certificate.',
    now()
  ),
  (
    'c5555555-5555-4555-8555-555555555551',
    '55555555-5555-4555-8555-555555555555',
    'license',
    'Journeyman Electrician',
    'Texas Department of Licensing and Regulation',
    'EC13001234',
    'TX',
    '2021-09-15',
    '2027-09-15',
    'approved',
    'License number and state recorded for manual review.',
    now()
  ),
  (
    'c6666666-6666-4666-8666-666666666661',
    '66666666-6666-4666-8666-666666666666',
    'license',
    'Texas Plumber License',
    'Texas State Board of Plumbing Examiners',
    'PL-55821',
    'TX',
    '2024-02-01',
    '2027-02-01',
    'pending',
    null,
    null
  ),
  (
    'c8888888-8888-4888-8888-888888888881',
    '88888888-8888-4888-8888-888888888888',
    'certification',
    'OSHA 30',
    'Occupational Safety and Health Administration',
    'OSHA30-18823',
    null,
    '2024-11-03',
    null,
    'approved',
    'Card photo accepted in pilot review.',
    now()
  ),
  (
    'c9999999-9999-4999-8999-999999999991',
    '99999999-9999-4999-8999-999999999999',
    'certification',
    'ASE Automobile A-Series',
    'National Institute for Automotive Service Excellence',
    'ASE-A44821',
    null,
    '2023-01-20',
    '2028-01-20',
    'approved',
    'ASE certificate accepted in pilot review.',
    now()
  );

insert into public.portfolio_items (id, worker_id, title, description, image_path, completed_on)
values
  (
    'd4444444-4444-4444-8444-444444444441',
    '44444444-4444-4444-8444-444444444444',
    'Heat pump changeout',
    'Replaced a failing split system with a 3-ton heat pump in South Austin.',
    '/seed/hvac.svg',
    '2026-03-18'
  ),
  (
    'd5555555-5555-4555-8555-555555555551',
    '55555555-5555-4555-8555-555555555555',
    '200-amp panel upgrade',
    'Service upgrade and labeling for a 1970s bungalow in Houston.',
    '/seed/electrical.svg',
    '2026-01-09'
  ),
  (
    'd6666666-6666-4666-8666-666666666661',
    '66666666-6666-4666-8666-666666666666',
    'Water heater replacement',
    '40-gallon gas water heater swap with new shutoffs.',
    '/seed/plumbing.svg',
    '2025-11-02'
  ),
  (
    'd7777777-7777-4777-8777-777777777771',
    '77777777-7777-4777-8777-777777777777',
    'Structural weld repair',
    'Field repair on a trailer frame. Credentials still to be submitted.',
    '/seed/welding.svg',
    '2026-02-14'
  ),
  (
    'd8888888-8888-4888-8888-888888888881',
    '88888888-8888-4888-8888-888888888888',
    'Cedar deck frame',
    'Framed and decked a 14 by 20 cedar platform.',
    '/seed/carpentry.svg',
    '2025-08-22'
  ),
  (
    'd9999999-9999-4999-8999-999999999991',
    '99999999-9999-4999-8999-999999999999',
    'Brake and diagnostic job',
    'Front brake service and charging-system diagnosis.',
    '/seed/mechanics.svg',
    '2026-04-04'
  );

insert into public.jobs (
  id, employer_id, title, trade, description, city, state, employment_type,
  pay_min, pay_max, pay_unit, required_certification, status
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '22222222-2222-4222-8222-222222222222',
    'HVAC Service Technician',
    'HVAC',
    'Run service calls, diagnose heat pumps and gas furnaces, and document EPA certification. Van and tablet provided. On-call rotation every fifth week.',
    'Austin',
    'TX',
    'full_time',
    28,
    36,
    'hour',
    'EPA 608',
    'open'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '33333333-3333-4333-8333-333333333333',
    'Journeyman Electrician',
    'Electrical',
    'Rough-in and trim for production homes. Must hold an active Texas journeyman license. Crews start at 7am.',
    'Dallas',
    'TX',
    'full_time',
    32,
    45,
    'hour',
    'Journeyman Electrician',
    'open'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '33333333-3333-4333-8333-333333333333',
    'Finish Carpenter',
    'Carpentry',
    'Interior trim, doors, and punch-list carpentry on occupied and new homes. Contract through the end of the year with option to extend.',
    'Dallas',
    'TX',
    'contract',
    30,
    40,
    'hour',
    null,
    'open'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    '22222222-2222-4222-8222-222222222222',
    'Plumber, new construction',
    'Plumbing',
    'Top-out and trim plumbing on custom homes west of Houston. Contract role, 4-day weeks.',
    'Houston',
    'TX',
    'contract',
    30,
    42,
    'hour',
    null,
    'open'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    '33333333-3333-4333-8333-333333333333',
    'Construction Site Lead',
    'Construction',
    'Coordinate subs and daily safety walks on two active subdivisions. OSHA 30 preferred.',
    'Dallas',
    'TX',
    'full_time',
    70000,
    85000,
    'year',
    'OSHA 30',
    'open'
  );

insert into public.applications (id, job_id, worker_id, cover_note, status)
values
  (
    'b4444444-4444-4444-8444-444444444441',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '44444444-4444-4444-8444-444444444444',
    'EPA 608 and NATE are both on my profile. I can start service calls in Austin next Monday.',
    'submitted'
  ),
  (
    'b5555555-5555-4555-8555-555555555551',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '55555555-5555-4555-8555-555555555555',
    'Active Texas journeyman license EC13001234. Open to Dallas production work.',
    'reviewed'
  ),
  (
    'b8888888-8888-4888-8888-888888888881',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '88888888-8888-4888-8888-888888888888',
    'Finish carpentry is most of my recent work. I have OSHA 30 on file.',
    'submitted'
  );
