-- ============================================================================
-- HireVify Supabase Database Migration
-- ============================================================================
-- This migration creates all necessary tables for the HireVify platform
-- Tables: users, candidates, recruiters, jobs, applications, portfolios, etc.
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE (Auth User Profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  company_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. CANDIDATE PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  years_of_experience INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  education TEXT,
  certifications TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  previous_companies TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  resume_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  preferred_work_type TEXT[] DEFAULT '{fulltime,contract}',
  availability TEXT DEFAULT 'immediate' CHECK (availability IN ('immediate', 'two-weeks', 'one-month', 'not-looking')),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  timezone TEXT,
  response_rate DECIMAL(3,2) DEFAULT 0,
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_profiles_skills ON candidate_profiles USING GIN(skills);

-- ============================================================================
-- 3. RECRUITER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  industry TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  company_description TEXT,
  hiring_team_size INTEGER DEFAULT 1,
  verified_recruiter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);
CREATE INDEX idx_recruiter_profiles_company_name ON recruiter_profiles(company_name);

-- ============================================================================
-- 4. JOBS/PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  nice_to_have TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  job_type TEXT DEFAULT 'contract' CHECK (job_type IN ('fulltime', 'contract', 'freelance', 'internship')),
  experience_level TEXT DEFAULT 'mid' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  location TEXT,
  remote_type TEXT DEFAULT 'remote' CHECK (remote_type IN ('remote', 'onsite', 'hybrid')),
  budget_min INTEGER,
  budget_max INTEGER,
  budget_currency TEXT DEFAULT 'USD',
  timeline_start DATE,
  timeline_end DATE,
  timeline_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'paused')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  has_assessment BOOLEAN DEFAULT FALSE,
  assessment_id UUID,
  has_video_challenge BOOLEAN DEFAULT FALSE,
  video_challenge_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- ============================================================================
-- 5. APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  match_score DECIMAL(3,2),
  notes TEXT,
  recruiter_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  offer_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at DESC);

-- ============================================================================
-- 6. PORTFOLIO ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);
CREATE INDEX idx_portfolio_items_created_at ON portfolio_items(created_at DESC);

-- ============================================================================
-- 7. SAVED JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_saved_jobs_candidate_id ON saved_jobs(candidate_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);

-- ============================================================================
-- 8. ASSESSMENTS/TESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT DEFAULT 'technical' CHECK (assessment_type IN ('technical', 'soft-skills', 'coding', 'custom')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes INTEGER,
  questions JSONB NOT NULL DEFAULT '[]',
  pass_score INTEGER DEFAULT 70,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_created_by ON assessments(created_by);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);

-- ============================================================================
-- 9. TEST ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  passed BOOLEAN,
  time_taken_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_assessment_id ON test_attempts(assessment_id);
CREATE INDEX idx_test_attempts_completed_at ON test_attempts(completed_at DESC);

-- ============================================================================
-- 10. VIDEO SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  recruiter_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_submissions_candidate_id ON video_submissions(candidate_id);
CREATE INDEX idx_video_submissions_job_id ON video_submissions(job_id);

-- ============================================================================
-- 11. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- ============================================================================
-- 12. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('application', 'message', 'interview', 'offer', 'job-match', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- 13. MESSAGES/CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_initiator_id ON conversations(initiator_id);
CREATE INDEX idx_conversations_recipient_id ON conversations(recipient_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================================
-- 14. ACTIVITY LOGS / AUDIT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================================
-- 15. CV EVALUATION RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cv_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cv_url TEXT NOT NULL,
  ats_score DECIMAL(3,2),
  ai_feedback JSONB,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  evaluated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cv_evaluations_candidate_id ON cv_evaluations(candidate_id);
CREATE INDEX idx_cv_evaluations_evaluated_at ON cv_evaluations(evaluated_at DESC);

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_evaluations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view all profiles (public info)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Users can insert their own profile during signup
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================================
-- CANDIDATE PROFILES POLICIES
-- ============================================================================

-- Candidates and recruiters can view all candidate profiles
CREATE POLICY "candidate_profiles_select_all" ON candidate_profiles
  FOR SELECT USING (true);

-- Users can insert their own candidate profile
CREATE POLICY "candidate_profiles_insert_own" ON candidate_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id)
  );

-- Users can update their own candidate profile
CREATE POLICY "candidate_profiles_update_own" ON candidate_profiles
  FOR UPDATE USING (
    auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id)
  ) WITH CHECK (
    auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id)
  );

-- ============================================================================
-- RECRUITER PROFILES POLICIES
-- ============================================================================

-- Recruiters can view all recruiter profiles
CREATE POLICY "recruiter_profiles_select_all" ON recruiter_profiles
  FOR SELECT USING (true);

-- Users can update their own recruiter profile
CREATE POLICY "recruiter_profiles_update_own" ON recruiter_profiles
  FOR UPDATE USING (
    auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id)
  ) WITH CHECK (
    auth.uid() = (SELECT auth_user_id FROM profiles WHERE id = user_id)
  );

-- ============================================================================
-- JOBS POLICIES
-- ============================================================================

-- Anyone can view published jobs
CREATE POLICY "jobs_select_published" ON jobs
  FOR SELECT USING (status = 'published' OR recruiter_id = auth.uid()::uuid);

-- Recruiters can view their own job drafts
CREATE POLICY "jobs_select_own_draft" ON jobs
  FOR SELECT USING (
    recruiter_id = auth.uid()::uuid
  );

-- Recruiters can insert their own jobs
CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (
    recruiter_id = auth.uid()::uuid
  );

-- Recruiters can update their own jobs
CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE USING (
    recruiter_id = auth.uid()::uuid
  ) WITH CHECK (
    recruiter_id = auth.uid()::uuid
  );

-- ============================================================================
-- APPLICATIONS POLICIES
-- ============================================================================

-- Candidates can view their own applications
CREATE POLICY "applications_select_own" ON applications
  FOR SELECT USING (
    candidate_id = auth.uid()::uuid OR
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Candidates can insert applications
CREATE POLICY "applications_insert_own" ON applications
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid()::uuid
  );

-- Candidates can update their own applications (withdraw)
CREATE POLICY "applications_update_own" ON applications
  FOR UPDATE USING (
    candidate_id = auth.uid()::uuid
  ) WITH CHECK (
    candidate_id = auth.uid()::uuid
  );

-- Recruiters can update applications for their jobs
CREATE POLICY "applications_update_recruiter" ON applications
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  ) WITH CHECK (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- ============================================================================
-- PORTFOLIO ITEMS POLICIES
-- ============================================================================

-- Anyone can view portfolio items
CREATE POLICY "portfolio_items_select_all" ON portfolio_items
  FOR SELECT USING (true);

-- Users can manage their own portfolio items
CREATE POLICY "portfolio_items_manage_own" ON portfolio_items
  FOR ALL USING (
    user_id = auth.uid()::uuid
  ) WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- ============================================================================
-- SAVED JOBS POLICIES
-- ============================================================================

-- Users can view and manage their own saved jobs
CREATE POLICY "saved_jobs_manage_own" ON saved_jobs
  FOR ALL USING (
    candidate_id = auth.uid()::uuid
  ) WITH CHECK (
    candidate_id = auth.uid()::uuid
  );

-- ============================================================================
-- ASSESSMENTS POLICIES
-- ============================================================================

-- Anyone can view assessments
CREATE POLICY "assessments_select_all" ON assessments
  FOR SELECT USING (true);

-- Recruiters can manage their own assessments
CREATE POLICY "assessments_manage_own" ON assessments
  FOR ALL USING (
    created_by = auth.uid()::uuid
  ) WITH CHECK (
    created_by = auth.uid()::uuid
  );

-- ============================================================================
-- TEST ATTEMPTS POLICIES
-- ============================================================================

-- Users can view their own test attempts
CREATE POLICY "test_attempts_select_own" ON test_attempts
  FOR SELECT USING (
    user_id = auth.uid()::uuid OR
    assessment_id IN (SELECT id FROM assessments WHERE created_by = auth.uid()::uuid)
  );

-- Users can insert their own test attempts
CREATE POLICY "test_attempts_insert_own" ON test_attempts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- Users can update their own test attempts
CREATE POLICY "test_attempts_update_own" ON test_attempts
  FOR UPDATE USING (
    user_id = auth.uid()::uuid
  ) WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- ============================================================================
-- VIDEO SUBMISSIONS POLICIES
-- ============================================================================

-- Users can manage their own video submissions
CREATE POLICY "video_submissions_manage_own" ON video_submissions
  FOR SELECT USING (
    candidate_id = auth.uid()::uuid OR
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- Candidates can insert their own submissions
CREATE POLICY "video_submissions_insert_own" ON video_submissions
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid()::uuid
  );

-- Recruiters can update submissions for their jobs
CREATE POLICY "video_submissions_update_recruiter" ON video_submissions
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  ) WITH CHECK (
    job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()::uuid)
  );

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can view their own subscription
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (
    user_id = auth.uid()::uuid
  );

-- Users can insert their own subscription
CREATE POLICY "subscriptions_insert_own" ON subscriptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- Users can update their own subscription
CREATE POLICY "subscriptions_update_own" ON subscriptions
  FOR UPDATE USING (
    user_id = auth.uid()::uuid
  ) WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can view and manage their own notifications
CREATE POLICY "notifications_manage_own" ON notifications
  FOR ALL USING (
    user_id = auth.uid()::uuid
  ) WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- ============================================================================
-- CONVERSATIONS & MESSAGES POLICIES
-- ============================================================================

-- Users can view their own conversations
CREATE POLICY "conversations_select_own" ON conversations
  FOR SELECT USING (
    initiator_id = auth.uid()::uuid OR recipient_id = auth.uid()::uuid
  );

-- Users can insert conversations
CREATE POLICY "conversations_insert_own" ON conversations
  FOR INSERT WITH CHECK (
    initiator_id = auth.uid()::uuid
  );

-- Users can view messages in their conversations
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE initiator_id = auth.uid()::uuid OR recipient_id = auth.uid()::uuid
    )
  );

-- Users can insert messages to their conversations
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::uuid AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE initiator_id = auth.uid()::uuid OR recipient_id = auth.uid()::uuid
    )
  );

-- ============================================================================
-- ACTIVITY LOGS POLICIES
-- ============================================================================

-- Users can view their own activity logs
CREATE POLICY "activity_logs_select_own" ON activity_logs
  FOR SELECT USING (
    user_id = auth.uid()::uuid
  );

-- Users can insert their own activity logs
CREATE POLICY "activity_logs_insert_own" ON activity_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid
  );

-- ============================================================================
-- CV EVALUATIONS POLICIES
-- ============================================================================

-- Candidates can view their own CV evaluations
CREATE POLICY "cv_evaluations_select_own" ON cv_evaluations
  FOR SELECT USING (
    candidate_id = auth.uid()::uuid
  );

-- System can insert CV evaluations
CREATE POLICY "cv_evaluations_insert_own" ON cv_evaluations
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid()::uuid
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruiter_profiles_updated_at BEFORE UPDATE ON recruiter_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cv_evaluations_updated_at BEFORE UPDATE ON cv_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================
-- Note: Uncomment below to seed test data

-- Insert test recruiter if not exists
-- INSERT INTO profiles (auth_user_id, email, full_name, role, company_name)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001'::uuid,
--   'recruiter@hirevify.com',
--   'Test Recruiter',
--   'recruiter',
--   'Test Company'
-- ) ON CONFLICT (auth_user_id) DO NOTHING;

-- Insert test candidate if not exists
-- INSERT INTO profiles (auth_user_id, email, full_name, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000002'::uuid,
--   'candidate@hirevify.com',
--   'Test Candidate',
--   'candidate'
-- ) ON CONFLICT (auth_user_id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
