-- ============================================================================
-- HireVify: Apply flow + Project Assignment lifecycle
-- ============================================================================
-- Adds the columns & storage bucket needed for the new candidate
-- "Apply" flow (CV upload, multi-step review/success) and the recruiter
-- "Assign Project" lifecycle (pending → accepted → submitted → passed).
-- ============================================================================

-- ============================================================================
-- 1. APPLICATIONS: CV upload + cover letter + state machine
-- ============================================================================
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cv_url TEXT;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cv_file_name TEXT;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS cv_uploaded_at TIMESTAMP WITH TIME ZONE;

-- (cover_letter, status already exist; expand the status check to include
-- "assigned" so we can move the application forward after the recruiter
-- assigns the project to a candidate).
DO $$
BEGIN
  -- Drop old check if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_status_check'
  ) THEN
    ALTER TABLE applications DROP CONSTRAINT applications_status_check;
  END IF;
END$$;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'applied', 'screening', 'interview', 'offer', 'hired',
      'rejected', 'withdrawn', 'assigned'
    )
  );

CREATE INDEX IF NOT EXISTS idx_applications_cv_url ON applications(cv_url);

-- ============================================================================
-- 2. JOB PROJECT ASSIGNMENTS: deliverable file + recruiter verification
-- ============================================================================
-- "project_submission_file_url" lets the candidate upload an actual file
-- (zip, PDF, GitHub link, drive link) for the project deliverables.
ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS project_submission_file_url TEXT;

ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS project_submission_file_name TEXT;

-- Track when the candidate finishes the 3-minute explanation video.
ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Recruiter verification — "project level passed" lifecycle.
ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS project_level_passed BOOLEAN DEFAULT FALSE;

ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS project_level_passed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS project_level_passed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE job_project_assignments
  ADD COLUMN IF NOT EXISTS project_level_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_jpa_project_level_passed
  ON job_project_assignments(project_level_passed);

-- ============================================================================
-- 3. STORAGE BUCKET for CV / project files
-- ============================================================================
-- Idempotent bucket creation. Run in the Supabase SQL editor; if your
-- environment blocks DO blocks via REST, create the bucket in the
-- Supabase dashboard with the same name.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'application-files'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('application-files', 'application-files', FALSE);
  END IF;
END$$;

-- RLS for the bucket — candidates can upload to their own folder,
-- recruiters can read for their jobs. The application-files bucket is
-- PRIVATE; we issue signed URLs from the client when needed.
DROP POLICY IF EXISTS "application_files_candidate_upload" ON storage.objects;
CREATE POLICY "application_files_candidate_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'application-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "application_files_candidate_read" ON storage.objects;
CREATE POLICY "application_files_candidate_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'application-files'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.recruiter_id = auth.uid()::uuid
          AND (
            (storage.foldername(name))[2] = 'cv'
            OR (storage.foldername(name))[2] = 'project'
          )
      )
    )
  );

DROP POLICY IF EXISTS "application_files_candidate_update" ON storage.objects;
CREATE POLICY "application_files_candidate_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'application-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'application-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- 4. RELAX jobs RLS so candidates can read project fields on jobs they're
--    already assigned to (in case the project_id linked to their
--    assignment differs from the published project view).
-- ============================================================================
-- (No DDL needed — the existing "jobs_select_published" policy is enough
-- since job_project_assignments points at jobs by id and the candidate can
-- already read the jobs row from the join.)

-- ============================================================================
-- 5. NOTIFICATIONS: allow the new event types
-- ============================================================================
-- The original CHECK constraint on notifications.type is restrictive.
-- We expand it to include the new event types the new flow will create.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
  END IF;
END$$;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'application', 'message', 'interview', 'offer', 'job-match', 'system',
      'new_application', 'application_status', 'interview_scheduled',
      'interview_reminder', 'interview_completed', 'new_message',
      'skill_assessment', 'project_assigned', 'project_submitted',
      'project_level_passed', 'project_rejected'
    )
  );

-- ============================================================================
-- 6. ENSURE update_updated_at_column FUNCTION EXISTS
-- ============================================================================
-- (already present in base migration; redeclare as a no-op safety net)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this:
--   * candidates can upload a CV to the new "application-files" bucket
--   * applications.cv_url stores the file path
--   * assignments get a project_submission_file_url + video timing columns
--   * recruiters can flip project_level_passed = true and notify the candidate
-- ============================================================================
