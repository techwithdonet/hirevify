-- ============================================================================
-- HireVify: Job/Project Unification + Project Assignments
-- ============================================================================
-- Goal:
--   * The "jobs" table is the single source of truth for BOTH jobs and
--     projects. A row can be a job (no project attached), a job WITH a
--     project attached (has_project=true), or a standalone project
--     (job_type='freelance' or a row that was previously a "project").
--   * This migration:
--       1. Adds the project_* columns to jobs (idempotent ADD COLUMN IF NOT EXISTS)
--       2. Creates the job_project_assignments table
--       3. Migrates any pre-existing "project-only" rows so they show up as
--          jobs with a project attached
--       4. Ensures RLS policies allow candidates to read project data
--   * Run this in the Supabase SQL editor.
-- ============================================================================

-- ============================================================================
-- 1. ADD PROJECT COLUMNS TO jobs (idempotent)
-- ============================================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS has_project               BOOLEAN     DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_title              TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_description        TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_skills             TEXT[]      DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_timeline           TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_budget_range       TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_deliverables       TEXT[]      DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name                TEXT;

-- Helpful indexes for the candidate-side Find Jobs page
CREATE INDEX IF NOT EXISTS idx_jobs_has_project     ON jobs(has_project);
CREATE INDEX IF NOT EXISTS idx_jobs_project_title   ON jobs(project_title);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created  ON jobs(status, created_at DESC);

-- ============================================================================
-- 2. CREATE job_project_assignments (idempotent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,

  assignment_status TEXT DEFAULT 'pending' CHECK (assignment_status IN (
    'pending', 'accepted', 'rejected', 'submitted',
    'under_review', 'hired', 'not_selected'
  )),

  project_submission_url TEXT,
  video_submission_url   TEXT,
  submission_notes       TEXT,
  submitted_at           TIMESTAMP WITH TIME ZONE,

  review_notes TEXT,
  reviewed_at  TIMESTAMP WITH TIME ZONE,

  final_decision TEXT CHECK (final_decision IN ('hired', 'not_selected')),
  decided_at     TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(job_id, project_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_jpa_job_id        ON job_project_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_jpa_project_id    ON job_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_jpa_candidate_id  ON job_project_assignments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_jpa_recruiter_id  ON job_project_assignments(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jpa_application   ON job_project_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_jpa_status        ON job_project_assignments(assignment_status);
CREATE INDEX IF NOT EXISTS idx_jpa_created_at    ON job_project_assignments(created_at DESC);

ALTER TABLE job_project_assignments ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own assignments
DROP POLICY IF EXISTS "jpa_select_own_candidate" ON job_project_assignments;
CREATE POLICY "jpa_select_own_candidate" ON job_project_assignments
  FOR SELECT USING (candidate_id = auth.uid()::uuid);

-- Recruiters can view assignments for their jobs
DROP POLICY IF EXISTS "jpa_select_recruiter" ON job_project_assignments;
CREATE POLICY "jpa_select_recruiter" ON job_project_assignments
  FOR SELECT USING (
    recruiter_id = auth.uid()::uuid OR
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Recruiters can insert assignments for their jobs
DROP POLICY IF EXISTS "jpa_insert_recruiter" ON job_project_assignments;
CREATE POLICY "jpa_insert_recruiter" ON job_project_assignments
  FOR INSERT WITH CHECK (
    recruiter_id = auth.uid()::uuid AND
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Candidates can update their own assignments (accept/reject, submit)
DROP POLICY IF EXISTS "jpa_update_candidate" ON job_project_assignments;
CREATE POLICY "jpa_update_candidate" ON job_project_assignments
  FOR UPDATE USING (candidate_id = auth.uid()::uuid)
  WITH CHECK (candidate_id = auth.uid()::uuid);

-- Recruiters can update assignments for their jobs
DROP POLICY IF EXISTS "jpa_update_recruiter" ON job_project_assignments;
CREATE POLICY "jpa_update_recruiter" ON job_project_assignments
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  ) WITH CHECK (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_job_project_assignments_updated_at ON job_project_assignments;
CREATE TRIGGER update_job_project_assignments_updated_at
  BEFORE UPDATE ON job_project_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. MIGRATE EXISTING PROJECT-ONLY ROWS → JOBS WITH PROJECT ATTACHED
-- ============================================================================
-- If a row was created via the old "Post Project" flow (job_type='freelance'
-- and a Timeline-style requirement), or has no job metadata, treat it as a
-- job-with-an-attached-project so candidates see the project details.
-- This is idempotent: rows that already have has_project=true are skipped.

UPDATE jobs
SET
  has_project = TRUE,
  project_title = COALESCE(project_title, title),
  project_description = COALESCE(project_description, description),
  project_timeline = COALESCE(
    project_timeline,
    (SELECT unnest(requirements) FROM jobs j2 WHERE j2.id = jobs.id
       AND unnest LIKE 'Timeline:%' LIMIT 1)
  ),
  -- Default skills fallback: empty array if none set
  project_skills = COALESCE(NULLIF(project_skills, '{}'), skills, '{}'),
  project_budget_range = COALESCE(
    project_budget_range,
    CASE
      WHEN budget_min IS NOT NULL AND budget_max IS NOT NULL
        THEN COALESCE(budget_currency, 'USD') || ' '
             || budget_min::text || ' - '
             || budget_max::text
      ELSE NULL
    END
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE
  has_project = FALSE
  AND (
    job_type = 'freelance'
    OR location = 'Not specified'
    OR EXISTS (
      SELECT 1 FROM unnest(requirements) AS r WHERE r LIKE 'Timeline:%'
    )
  );

-- ============================================================================
-- 4. CONFIRM CANDIDATES CAN READ PROJECT FIELDS ON jobs
-- ============================================================================
-- The existing policy "jobs_select_published" already lets anyone read
-- status='published' rows. Candidates will see the project_title etc. on
-- any published job. No additional policy is needed.
--
-- If you want to HIDE the project from candidates until they apply,
-- tighten the SELECT policy like this (optional):
--
--   DROP POLICY "jobs_select_published" ON jobs;
--   CREATE POLICY "jobs_select_published" ON jobs
--     FOR SELECT USING (
--       status = 'published'
--       AND (
--         has_project = FALSE
--         OR auth.uid()::uuid IN (
--           SELECT candidate_id FROM applications
--           WHERE job_id = jobs.id
--         )
--       )
--       OR recruiter_id = auth.uid()::uuid
--     );
--
-- We do NOT apply the tightened policy here — the app's current behavior is
-- "show project data on the job page", which matches the migration above.

-- ============================================================================
-- 5. OPTIONAL: ensure company_name is filled (it is shown in the candidate UI)
-- ============================================================================
UPDATE jobs
SET company_name = COALESCE(company_name, 'Company')
WHERE company_name IS NULL;

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this, the existing "project" row in your DB will appear to
-- candidates as a job with the project details visible. The recruiter can
-- still post new jobs, new standalone projects, or link new projects to
-- existing jobs via the "Post Project Only" → "Link to an existing job"
-- dropdown in the dashboard.
-- ============================================================================
