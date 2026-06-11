# HireVify Supabase Setup Guide

## Overview
This guide explains how to set up the Supabase database for HireVify, including schema creation, RLS policies, and environment configuration.

## Prerequisites
- Supabase account and project created
- Project URL and anon key ready
- Access to Supabase SQL editor

## Environment Variables
Add these to your `.env.local` file (Next.js will automatically read them):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note:** These are public-facing keys (prefixed with `NEXT_PUBLIC_`). Never share the service role key in frontend code.

## Step 1: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase_migration.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Verify all tables were created successfully

### Option B: Using Supabase CLI
```bash
supabase db push
```

## Step 2: Verify Schema Creation

Run this query in your SQL editor to verify all tables exist:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Expected tables:
- profiles
- candidate_profiles
- recruiter_profiles
- jobs
- applications
- portfolio_items
- saved_jobs
- assessments
- test_attempts
- video_submissions
- subscriptions
- notifications
- conversations
- messages
- activity_logs
- cv_evaluations

## Step 3: Enable RLS Policies

All RLS policies are automatically created by the migration. To verify:

```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

## Step 4: Create Auth Users (For Testing)

### Test Recruiter Account
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Create new user"
3. Email: `recruiter@hirevify.com`
4. Password: `TestPassword123!`
5. Click "Create user"

### Test Candidate Account
1. Click "Create new user"
2. Email: `candidate@hirevify.com`
3. Password: `TestPassword123!`
4. Click "Create user"

### Create Profiles for Test Users (Run in SQL Editor)

```sql
-- Get the UUIDs of your created auth users first by running:
SELECT id, email FROM auth.users;

-- Then update these with the actual UUIDs:
INSERT INTO profiles (auth_user_id, email, full_name, role, company_name)
VALUES 
  ('RECRUITER_UUID_HERE', 'recruiter@hirevify.com', 'Test Recruiter', 'recruiter', 'Test Company'),
  ('CANDIDATE_UUID_HERE', 'candidate@hirevify.com', 'Test Candidate', 'candidate', null)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Create test recruiter profile
INSERT INTO recruiter_profiles (user_id, company_name, company_size, industry)
SELECT id, 'Test Company', 'medium', 'Technology'
FROM profiles WHERE email = 'recruiter@hirevify.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create test candidate profile
INSERT INTO candidate_profiles (user_id, headline, years_of_experience, skills)
SELECT id, 'Senior Software Engineer', 5, '{"TypeScript", "React", "Node.js"}'::text[]
FROM profiles WHERE email = 'candidate@hirevify.com'
ON CONFLICT (user_id) DO NOTHING;

-- Create free tier subscriptions for both
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM profiles WHERE email IN ('recruiter@hirevify.com', 'candidate@hirevify.com')
ON CONFLICT (user_id) DO NOTHING;
```

## Step 5: Test the Connection

The app will automatically test the connection on startup. Check browser console for:
- ✅ "Supabase connection check passed" = Everything working
- ❌ Error messages = Connection issue, check environment variables

## Important Table Details

### Profiles Table
- Core user data linked to Supabase Auth
- Stores `role` (candidate, recruiter, admin)
- All other user-specific tables reference this

### Candidate/Recruiter Profiles
- Extended profile data specific to each user type
- ONE-to-ONE relationship with profiles table
- Keep minimal; extend only what's needed

### Jobs Table
- Job postings created by recruiters
- Can have optional assessments and video challenges
- Status: draft → published → closed/paused

### Applications Table
- Links candidates to jobs
- Tracks status progression: applied → screening → interview → offer → hired
- Unique constraint on (job_id, candidate_id) prevents duplicate applications

### Subscriptions Table
- Free/Pro/Enterprise tiers
- Tracks Stripe integration (stripe_subscription_id, stripe_customer_id)
- Supports trial periods

## Row Level Security (RLS)

All tables have RLS enabled. Key policies:

1. **Public Data**: Profiles, published jobs, portfolio items can be viewed by anyone
2. **Private Data**: Users can only manage their own data (applications, notifications, etc.)
3. **Recruiter Permissions**: Recruiters can manage their jobs and view applications to those jobs
4. **Candidate Permissions**: Candidates can manage their own portfolio and applications

### Example: How Applications RLS Works

- Candidate can view: `WHERE candidate_id = current_user_id`
- Recruiter can view: `WHERE job_id IN (jobs owned by recruiter)`
- Update/Delete: Only candidates can update their own; recruiters update for hiring decisions

## Subscription Tier Access

### Free Tier
- Post/Apply to 5 jobs/month
- Basic profile
- Limited notifications

### Pro Tier
- Unlimited posts/applications
- Advanced analytics
- AI-powered matching
- Video interviews
- Custom assessments
- Portfolio analytics

### Enterprise Tier
- Everything in Pro
- Dedicated support
- Custom integrations
- API access
- Team management

## Stripe Integration (Future)

When implementing payments:

1. Add Stripe webhook endpoint to handle subscription updates
2. Update `subscriptions.stripe_subscription_id` on payment success
3. Create function to sync subscription status with Stripe
4. Update premium feature checks based on actual subscription status

```sql
-- Example: Create a function to update subscription from Stripe webhook
CREATE OR REPLACE FUNCTION handle_stripe_subscription_update(
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_tier TEXT,
  p_status TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    stripe_subscription_id = p_stripe_subscription_id,
    tier = p_tier,
    status = p_status,
    expires_at = p_expires_at,
    updated_at = CURRENT_TIMESTAMP
  WHERE stripe_customer_id = p_stripe_customer_id;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring & Maintenance

### Check User Activity
```sql
SELECT * FROM activity_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Monitor Application Status
```sql
SELECT 
  j.title,
  COUNT(a.id) as total_applications,
  COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as new,
  COUNT(CASE WHEN a.status = 'screening' THEN 1 END) as screening,
  COUNT(CASE WHEN a.status = 'interview' THEN 1 END) as interview,
  COUNT(CASE WHEN a.status = 'offer' THEN 1 END) as offers
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
GROUP BY j.id, j.title;
```

### View Popular Skills
```sql
SELECT skill, COUNT(*) as count
FROM jobs, LATERAL UNNEST(jobs.skills) skill
WHERE jobs.status = 'published'
GROUP BY skill
ORDER BY count DESC
LIMIT 20;
```

## Backup & Recovery

Supabase automatically backs up your database. To restore:
1. Go to Supabase Dashboard → Settings → Backups
2. Select the backup date
3. Click "Restore"

⚠️ **Warning:** Restoration will overwrite current data.

## Troubleshooting

### Problem: "auth.users does not exist" error
**Solution:** Make sure Supabase Auth is enabled in your project settings.

### Problem: RLS policies blocking all queries
**Solution:** Check that auth.uid() is being set correctly. In client code, it should automatically use the logged-in user's ID.

### Problem: Profile creation fails during signup
**Solution:** Verify the `profiles` table exists and the trigger for `auth.users` creation is working. Check Supabase Dashboard → Database → Webhooks.

### Problem: "Permission denied" on select queries
**Solution:** Make sure the role in Supabase matches the role in your profiles table. Run:
```sql
SELECT * FROM profiles WHERE auth_user_id = auth.uid();
```

## Next Steps

1. ✅ Create schema with migration
2. ✅ Create test users
3. ⏭️ Update AuthProvider to use real profiles
4. ⏭️ Replace mock data with Supabase queries
5. ⏭️ Test all flows with real data
6. ⏭️ Set up Stripe for payments

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
