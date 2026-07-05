-- Adds recruiter-friendly professional profile fields to candidate_profiles.
-- This project stores candidate details in candidate_profiles rather than a candidates table.

ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS current_location TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS total_experience NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS current_company TEXT,
  ADD COLUMN IF NOT EXISTS current_designation TEXT,
  ADD COLUMN IF NOT EXISTS employment_status TEXT,
  ADD COLUMN IF NOT EXISTS notice_period TEXT,
  ADD COLUMN IF NOT EXISTS preferred_locations TEXT[],
  ADD COLUMN IF NOT EXISTS employment_type TEXT,
  ADD COLUMN IF NOT EXISTS work_mode TEXT,
  ADD COLUMN IF NOT EXISTS expected_salary TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS preferred_roles TEXT[],
  ADD COLUMN IF NOT EXISTS career_level TEXT,
  ADD COLUMN IF NOT EXISTS work_authorization TEXT,
  ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS profile_last_updated TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resume_verified BOOLEAN DEFAULT FALSE;

-- Existing link/language columns are kept if already present, and created if missing.
ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'candidate_profiles_total_experience_non_negative'
  ) THEN
    ALTER TABLE public.candidate_profiles
      ADD CONSTRAINT candidate_profiles_total_experience_non_negative
      CHECK (total_experience IS NULL OR total_experience >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'candidate_profiles_profile_views_non_negative'
  ) THEN
    ALTER TABLE public.candidate_profiles
      ADD CONSTRAINT candidate_profiles_profile_views_non_negative
      CHECK (profile_views >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_current_location
  ON public.candidate_profiles (current_location);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_country_state_city
  ON public.candidate_profiles (country, state, city);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_total_experience
  ON public.candidate_profiles (total_experience);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_employment_status
  ON public.candidate_profiles (employment_status);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_work_mode
  ON public.candidate_profiles (work_mode);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_career_level
  ON public.candidate_profiles (career_level);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_preferred_roles
  ON public.candidate_profiles USING GIN (preferred_roles);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_preferred_locations
  ON public.candidate_profiles USING GIN (preferred_locations);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_languages
  ON public.candidate_profiles USING GIN (languages);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_profile_last_updated
  ON public.candidate_profiles (profile_last_updated DESC);

CREATE OR REPLACE FUNCTION public.set_candidate_profile_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_last_updated = NOW();
  NEW.updated_at = COALESCE(NEW.updated_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidate_profiles_last_updated ON public.candidate_profiles;

CREATE TRIGGER trg_candidate_profiles_last_updated
BEFORE UPDATE ON public.candidate_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_candidate_profile_last_updated();
