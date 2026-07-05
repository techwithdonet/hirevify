-- Add date_of_birth to candidate_profiles table
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Also add to profiles table for basic info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_date_of_birth ON candidate_profiles(date_of_birth);
