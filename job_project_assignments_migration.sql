-- ============================================================================
-- HireVify Job Project Assignments Migration
-- ============================================================================
-- This migration creates the job_project_assignments table to link jobs
-- with projects and track candidate project assignments throughout the hiring flow.
-- ============================================================================

-- ============================================================================
-- 1. JOB PROJECT ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  
  -- Project assignment status
  assignment_status TEXT DEFAULT 'pending' CHECK (assignment_status IN (
    'pending',      -- Project assigned, awaiting candidate response
    'accepted',     -- Candidate accepted the project
    'rejected',     -- Candidate rejected the project
    'submitted',    -- Candidate submitted project deliverables
    'under_review', -- Recruiter is reviewing submission
    'hired',        -- Candidate selected/hired
    'not_selected'  -- Candidate not selected
  )),
  
  -- Submission details
  project_submission_url TEXT,
  video_submission_url TEXT,
  submission_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Review details
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Final decision
  final_decision TEXT CHECK (final_decision IN ('hired', 'not_selected')),
  decided_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one assignment per candidate per project
  UNIQUE(job_id, project_id, candidate_id)
);

CREATE INDEX idx_job_project_assignments_job_id ON job_project_assignments(job_id);
CREATE INDEX idx_job_project_assignments_project_id ON job_project_assignments(project_id);
CREATE INDEX idx_job_project_assignments_candidate_id ON job_project_assignments(candidate_id);
CREATE INDEX idx_job_project_assignments_recruiter_id ON job_project_assignments(recruiter_id);
CREATE INDEX idx_job_project_assignments_application_id ON job_project_assignments(application_id);
CREATE INDEX idx_job_project_assignments_status ON job_project_assignments(assignment_status);
CREATE INDEX idx_job_project_assignments_created_at ON job_project_assignments(created_at DESC);

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE job_project_assignments ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own assignments
CREATE POLICY "job_project_assignments_select_own_candidate" ON job_project_assignments
  FOR SELECT USING (candidate_id = auth.uid()::uuid);

-- Recruiters can view assignments for their jobs
CREATE POLICY "job_project_assignments_select_recruiter" ON job_project_assignments
  FOR SELECT USING (
    recruiter_id = auth.uid()::uuid OR
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Recruiters can insert assignments for their jobs
CREATE POLICY "job_project_assignments_insert_recruiter" ON job_project_assignments
  FOR INSERT WITH CHECK (
    recruiter_id = auth.uid()::uuid AND
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Candidates can update their own assignments (accept/reject, submit)
CREATE POLICY "job_project_assignments_update_candidate" ON job_project_assignments
  FOR UPDATE USING (candidate_id = auth.uid()::uuid)
  WITH CHECK (candidate_id = auth.uid()::uuid);

-- Recruiters can update assignments for their jobs
CREATE POLICY "job_project_assignments_update_recruiter" ON job_project_assignments
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  ) WITH CHECK (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- ============================================================================
-- 3. UPDATE UPDATED_AT TRIGGER
-- ============================================================================
CREATE TRIGGER update_job_project_assignments_updated_at BEFORE UPDATE ON job_project_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ADD PROJECT FIELDS TO JOBS TABLE (for job-specific projects)
-- ============================================================================
-- These fields allow a job to have its own embedded project description
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS has_project BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_title TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_skills TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_timeline TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_budget_range TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS project_deliverables TEXT[] DEFAULT '{}';

-- Add RLS policy for new columns (inherits from existing jobs policies)
-- No new policy needed - existing jobs policies cover these

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
