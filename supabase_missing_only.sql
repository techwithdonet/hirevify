-- ============================================================
-- MISSING-COLUMNS ONLY check. Returns rows ONLY where the
-- database is missing a column the code expects.
-- If this returns 0 rows, your schema is correct.
-- ============================================================

SELECT
  e.table_name,
  e.column_name
FROM (VALUES
  ('profiles', 'id'), ('profiles', 'auth_user_id'), ('profiles', 'email'),
  ('profiles', 'full_name'), ('profiles', 'role'), ('profiles', 'avatar_url'),
  ('profiles', 'bio'), ('profiles', 'phone'), ('profiles', 'location'),
  ('profiles', 'timezone'), ('profiles', 'company_name'),
  ('profiles', 'is_verified'), ('profiles', 'created_at'),
  ('profiles', 'updated_at'), ('profiles', 'date_of_birth'),

  ('candidate_profiles', 'id'), ('candidate_profiles', 'user_id'),
  ('candidate_profiles', 'full_name'), ('candidate_profiles', 'phone'),
  ('candidate_profiles', 'location'), ('candidate_profiles', 'bio'),
  ('candidate_profiles', 'date_of_birth'), ('candidate_profiles', 'headline'),
  ('candidate_profiles', 'skills'), ('candidate_profiles', 'years_of_experience'),
  ('candidate_profiles', 'experience_level'),
  ('candidate_profiles', 'experience_summary'),
  ('candidate_profiles', 'education'), ('candidate_profiles', 'certifications'),
  ('candidate_profiles', 'languages'), ('candidate_profiles', 'previous_companies'),
  ('candidate_profiles', 'achievements'), ('candidate_profiles', 'resume_url'),
  ('candidate_profiles', 'portfolio_url'), ('candidate_profiles', 'github_url'),
  ('candidate_profiles', 'linkedin_url'),
  ('candidate_profiles', 'preferred_work_type'),
  ('candidate_profiles', 'preferred_job_type'),
  ('candidate_profiles', 'availability'), ('candidate_profiles', 'salary_min'),
  ('candidate_profiles', 'salary_max'), ('candidate_profiles', 'salary_currency'),
  ('candidate_profiles', 'timezone'), ('candidate_profiles', 'response_rate'),
  ('candidate_profiles', 'response_time'),
  ('candidate_profiles', 'profile_completeness'),
  ('candidate_profiles', 'profile_completed'),
  ('candidate_profiles', 'current_location'), ('candidate_profiles', 'country'),
  ('candidate_profiles', 'state'), ('candidate_profiles', 'city'),
  ('candidate_profiles', 'total_experience'),
  ('candidate_profiles', 'current_company'),
  ('candidate_profiles', 'current_designation'),
  ('candidate_profiles', 'employment_status'),
  ('candidate_profiles', 'notice_period'),
  ('candidate_profiles', 'preferred_locations'),
  ('candidate_profiles', 'employment_type'), ('candidate_profiles', 'work_mode'),
  ('candidate_profiles', 'expected_salary'), ('candidate_profiles', 'industry'),
  ('candidate_profiles', 'preferred_roles'), ('candidate_profiles', 'career_level'),
  ('candidate_profiles', 'work_authorization'),
  ('candidate_profiles', 'willing_to_relocate'),
  ('candidate_profiles', 'available_from'),
  ('candidate_profiles', 'profile_last_updated'),
  ('candidate_profiles', 'profile_views'),
  ('candidate_profiles', 'email_verified'), ('candidate_profiles', 'phone_verified'),
  ('candidate_profiles', 'resume_verified'),
  ('candidate_profiles', 'created_at'), ('candidate_profiles', 'updated_at'),

  ('applications', 'id'), ('applications', 'job_id'),
  ('applications', 'candidate_id'), ('applications', 'cover_letter'),
  ('applications', 'cv_url'), ('applications', 'cv_file_name'),
  ('applications', 'status'), ('applications', 'match_score'),
  ('applications', 'notes'), ('applications', 'created_at'),
  ('applications', 'updated_at'), ('applications', 'submitted_at'),
  ('applications', 'recruiter_id'),

  ('jobs', 'id'), ('jobs', 'recruiter_id'), ('jobs', 'title'),
  ('jobs', 'description'), ('jobs', 'skills'), ('jobs', 'requirements'),
  ('jobs', 'experience_level'), ('jobs', 'status'),
  ('jobs', 'job_type'), ('jobs', 'has_project'),
  ('jobs', 'applications_count'), ('jobs', 'created_at'),

  ('portfolio_items', 'id'), ('portfolio_items', 'user_id'),
  ('portfolio_items', 'title'), ('portfolio_items', 'project_url'),
  ('portfolio_items', 'live_url'), ('portfolio_items', 'github_url'),

  ('notifications', 'id'), ('notifications', 'user_id'),
  ('notifications', 'type'), ('notifications', 'title'),
  ('notifications', 'message'), ('notifications', 'data'),
  ('notifications', 'read'), ('notifications', 'created_at'),

  ('job_project_assignments', 'id'),
  ('job_project_assignments', 'job_id'),
  ('job_project_assignments', 'project_id'),
  ('job_project_assignments', 'candidate_id'),
  ('job_project_assignments', 'recruiter_id'),
  ('job_project_assignments', 'application_id'),
  ('job_project_assignments', 'assignment_status'),
  ('job_project_assignments', 'project_submission_url'),
  ('job_project_assignments', 'video_submission_url'),
  ('job_project_assignments', 'submission_notes'),
  ('job_project_assignments', 'created_at'),
  ('job_project_assignments', 'updated_at'),

  ('recruiter_profiles', 'id'), ('recruiter_profiles', 'user_id'),
  ('recruiter_profiles', 'company_name'), ('recruiter_profiles', 'created_at'),

  ('subscriptions', 'id'), ('subscriptions', 'user_id'),
  ('subscriptions', 'plan'), ('subscriptions', 'status'),

  ('saved_jobs', 'id'), ('saved_jobs', 'candidate_id'),
  ('saved_jobs', 'job_id'), ('saved_jobs', 'created_at')
) AS e(table_name, column_name)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.table_name
 AND c.column_name = e.column_name
WHERE c.column_name IS NULL
ORDER BY e.table_name, e.column_name;