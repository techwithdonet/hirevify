-- ============================================================
-- Fix the 5 missing columns reported by the audit.
-- Safe to re-run (ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- 1. candidate_profiles.response_rate
--    Originally in supabase_migration.sql but may not have been
--    applied. Tracks candidate response rate (0.00 to 1.00).
ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS response_rate DECIMAL(3,2) DEFAULT 0
  CHECK (response_rate >= 0 AND response_rate <= 1);

-- 2. portfolio_items.live_url
--    ATSView reads this when building the candidate portfolio
--    section in the recruiter popup.
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS live_url TEXT;

-- 3. recruiter_profiles.user_id
--    FK to profiles.id; nullable so existing recruiter rows
--    (without a user_id) stay valid.
ALTER TABLE public.recruiter_profiles
  ADD COLUMN IF NOT EXISTS user_id UUID
  REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id
  ON public.recruiter_profiles (user_id);

-- 4. saved_jobs.created_at
ALTER TABLE public.saved_jobs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE
  DEFAULT CURRENT_TIMESTAMP;

-- 5. subscriptions.plan
--    Text column for plan name (free / pro / enterprise / etc.)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

-- Re-run the audit to confirm everything is now OK
-- (This is a placeholder — re-run supabase_missing_only.sql to verify)

NOTIFY pgrst, 'reload schema';