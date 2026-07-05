-- ============================================================
-- Catch-all migration: adds every candidate_profiles column
-- that the code (CandidateProfileEditor.tsx, ATSView.tsx,
-- CandidateSettings.tsx) writes/reads but no prior migration
-- added. Safe to re-run (ADD COLUMN IF NOT EXISTS).
--
-- After running this, also run the schema-cache refresh:
--   NOTIFY pgrst, 'reload schema';
-- ============================================================

ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS full_name              TEXT,
  ADD COLUMN IF NOT EXISTS phone                  TEXT,
  ADD COLUMN IF NOT EXISTS location               TEXT,
  ADD COLUMN IF NOT EXISTS experience_level       TEXT,
  ADD COLUMN IF NOT EXISTS experience_summary     TEXT,
  ADD COLUMN IF NOT EXISTS preferred_job_type     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_completed      BOOLEAN DEFAULT FALSE;

-- Helpful indexes for the recruiter search / filters
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_full_name
  ON public.candidate_profiles (full_name);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_experience_level
  ON public.candidate_profiles (experience_level);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_profile_completed
  ON public.candidate_profiles (profile_completed);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_preferred_job_type
  ON public.candidate_profiles USING GIN (preferred_job_type);

-- Backfill full_name / phone / location from the linked profiles row
-- so existing candidate_profiles rows aren't blank after the column is added.
UPDATE public.candidate_profiles cp
SET
  full_name = COALESCE(NULLIF(cp.full_name, ''), p.full_name),
  phone     = COALESCE(NULLIF(cp.phone, ''),     p.phone),
  location  = COALESCE(NULLIF(cp.location, ''),  p.location)
FROM public.profiles p
WHERE cp.user_id = p.id
  AND (cp.full_name IS NULL OR cp.full_name = '');

-- Force PostgREST to drop its cached schema and re-read the columns.
-- (Equivalent to: Supabase Dashboard -> API -> Reload schema.)
NOTIFY pgrst, 'reload schema';