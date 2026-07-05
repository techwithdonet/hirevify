-- ============================================================
-- Verification script for candidate_profiles schema.
-- Run each section one at a time, or all at once.
-- ============================================================

-- 1) Full column list of candidate_profiles (name, type, nullable, default)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'candidate_profiles'
ORDER BY ordinal_position;

-- 2) Spot-check: do the 7 columns from the catch-all migration exist?
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'candidate_profiles'
  AND column_name IN (
    'full_name',
    'phone',
    'location',
    'experience_level',
    'experience_summary',
    'preferred_job_type',
    'profile_completed',
    'available_from',
    'date_of_birth',
    'work_mode',
    'industry',
    'career_level',
    'willing_to_relocate',
    'profile_views'
  )
ORDER BY column_name;

-- 3) Any column the code writes but the table is MISSING?
--    If this returns rows, those columns still need to be added.
SELECT
  expected.column_name,
  expected.expected_type
FROM (
  VALUES
    ('full_name',            'text'),
    ('phone',                'text'),
    ('location',             'text'),
    ('bio',                  'text'),
    ('headline',             'text'),
    ('date_of_birth',        'date'),
    ('experience_level',     'text'),
    ('experience_summary',   'text'),
    ('preferred_job_type',   'ARRAY'),
    ('preferred_work_type',  'ARRAY'),
    ('skills',               'ARRAY'),
    ('certifications',       'ARRAY'),
    ('languages',            'ARRAY'),
    ('preferred_roles',      'ARRAY'),
    ('preferred_locations',  'ARRAY'),
    ('availability',         'text'),
    ('salary_min',           'integer'),
    ('salary_max',           'integer'),
    ('salary_currency',      'text'),
    ('timezone',             'text'),
    ('resume_url',           'text'),
    ('portfolio_url',        'text'),
    ('github_url',           'text'),
    ('linkedin_url',         'text'),
    ('education',            'text'),
    ('current_location',     'text'),
    ('country',              'text'),
    ('state',                'text'),
    ('city',                 'text'),
    ('total_experience',     'numeric'),
    ('current_company',      'text'),
    ('current_designation',  'text'),
    ('employment_status',    'text'),
    ('notice_period',        'text'),
    ('employment_type',      'text'),
    ('work_mode',            'text'),
    ('expected_salary',      'text'),
    ('industry',             'text'),
    ('career_level',         'text'),
    ('work_authorization',   'text'),
    ('willing_to_relocate',  'boolean'),
    ('available_from',       'date'),
    ('profile_last_updated', 'timestamp with time zone'),
    ('profile_views',        'integer'),
    ('response_time',        'text'),
    ('email_verified',       'boolean'),
    ('phone_verified',       'boolean'),
    ('resume_verified',      'boolean'),
    ('profile_completeness', 'integer'),
    ('profile_completed',    'boolean'),
    ('years_of_experience',  'integer')
) AS expected(column_name, expected_type)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = 'candidate_profiles'
 AND c.column_name = expected.column_name
WHERE c.column_name IS NULL;

-- 4) Indexes on candidate_profiles
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'candidate_profiles'
ORDER BY indexname;

-- 5) Row count + sample row (sanity check that backfill worked)
SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE full_name IS NOT NULL AND full_name <> '') AS rows_with_full_name,
  COUNT(*) FILTER (WHERE profile_completed = TRUE) AS completed_profiles
FROM public.candidate_profiles;

-- 6) One sample row (so you can eyeball that everything looks right)
SELECT *
FROM public.candidate_profiles
ORDER BY updated_at DESC NULLS LAST
LIMIT 1;