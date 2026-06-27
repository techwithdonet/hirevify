-- ============================================================================
-- HireVify: Job Project Attachment (replaces Project Budget Range)
-- ============================================================================
-- Goal:
--   * Recruiters can attach a file (any type, max 20MB) to a project
--     attached to a job.
--   * Remove the "Project Budget Range" field from the project section.
--   * Files are stored in the `job-project-attachments` Supabase storage
--     bucket; metadata is stored on the `jobs` row.
--   * Idempotent — safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- 1. Add attachment columns to jobs
-- ============================================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS project_attachment_url   TEXT,
  ADD COLUMN IF NOT EXISTS project_attachment_name  TEXT,
  ADD COLUMN IF NOT EXISTS project_attachment_size  BIGINT,
  ADD COLUMN IF NOT EXISTS project_attachment_type  TEXT;

-- (We keep `project_budget_range` in the schema for backward compatibility
-- with existing rows, but the UI no longer shows or writes to it.)

-- ============================================================================
-- 2. Create the storage bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-project-attachments',
  'job-project-attachments',
  true,
  20971520, -- 20 MB
  NULL      -- any MIME type
)
ON CONFLICT (id) DO UPDATE
  SET public          = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit;

-- ============================================================================
-- 3. RLS policies for the bucket
-- ============================================================================
-- Path convention: <recruiter_profile_id>/<job_id>/<timestamp>-<filename>
-- Anyone authenticated can read public files (the bucket is public).
-- Only the recruiter who owns the job row can upload / update / delete
-- under their own prefix.

DROP POLICY IF EXISTS "job_project_attachments_read" ON storage.objects;
CREATE POLICY "job_project_attachments_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-project-attachments');

DROP POLICY IF EXISTS "job_project_attachments_insert" ON storage.objects;
CREATE POLICY "job_project_attachments_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-project-attachments'
    AND auth.uid() IS NOT NULL
    -- First path segment must be the recruiter's profile id
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "job_project_attachments_update" ON storage.objects;
CREATE POLICY "job_project_attachments_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'job-project-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "job_project_attachments_delete" ON storage.objects;
CREATE POLICY "job_project_attachments_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'job-project-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Ensure RLS allows reading the new attachment columns on jobs
-- ============================================================================
-- The existing "jobs_select_published" / "jobs_select_recruiter_own" policies
-- already cover SELECT on all jobs columns, so no change is needed.

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this, the recruiter Post Job flow's project section will
-- have an "Attachment" file picker (any file, max 20MB) in place of the
-- "Project Budget Range" input. Uploaded files land in the
-- `job-project-attachments` bucket under `<recruiter_id>/<job_id>/...` and
-- the URL/name/size/type are stored on the jobs row.
-- ============================================================================