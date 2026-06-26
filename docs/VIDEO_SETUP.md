# Video Recording Feature Setup Guide

This document explains how to set up the Supabase storage buckets and edge function for the candidate video recording feature.

## Features

1. **File Upload** - Candidates can upload portfolio files (PDF, DOC, ZIP)
2. **Video Recording** - Candidates can record introduction videos (up to 5 minutes)
3. **Auto-Delete** - Videos are automatically deleted after 14 days
4. **Recruiter Notification** - Recruiters see candidate videos in their dashboard

## Setup Instructions

### 1. Create Supabase Storage Buckets

Run these commands in your Supabase SQL Editor or via CLI:

```sql
-- Create bucket for portfolio files (public access for recruiters)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-files',
  'portfolio-files',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-rar-compressed']
);

-- Create bucket for intro videos (private, but URLs can be generated for viewing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intro-videos',
  'intro-videos',
  true, -- Set to true so recruiters can view without auth
  104857600, -- 100MB limit
  ARRAY['video/webm', 'video/mp4']
);

-- Create storage policies for portfolio files
CREATE POLICY "Allow candidates to upload portfolio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow anyone to view portfolio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-files');

CREATE POLICY "Allow candidates to delete their own portfolio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for intro videos
CREATE POLICY "Allow candidates to upload intro videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'intro-videos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow anyone to view intro videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'intro-videos');

CREATE POLICY "Allow candidates to delete their own intro videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'intro-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2. Add Database Columns

Run this SQL to add the new columns to `candidate_profiles`:

```sql
-- Add video fields to candidate_profiles
ALTER TABLE candidate_profiles
ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
ADD COLUMN IF NOT EXISTS intro_video_comment TEXT,
ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS portfolio_files JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries on video expiration
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_video_expires
ON candidate_profiles (video_expires_at)
WHERE intro_video_url IS NOT NULL;
```

### 3. Deploy the Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the edge function
supabase functions deploy cleanup-expired-videos
```

### 4. Set Up Cron Job for Auto-Delete

In Supabase Dashboard:
1. Go to **Database** > **Extensions** and enable `pg_cron` if not enabled
2. Go to **Database** > **Schedules** or run:

```sql
-- Schedule the cleanup to run daily at 3 AM
SELECT cron.schedule(
  'cleanup-expired-videos',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/cleanup-expired-videos',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'
  );
  $$
);
```

Or use the Supabase Dashboard:
1. Go to **Edge Functions**
2. Click on `cleanup-expired-videos`
3. Set up a cron trigger for daily execution

### 5. Environment Variables

Make sure these are set in your Supabase Edge Function:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## API Flow

### When a Candidate Records a Video:

1. Candidate clicks "Record Video" button
2. Browser requests camera/microphone access
3. Recording starts (max 5 minutes)
4. Candidate can pause/resume or stop manually
5. After recording, candidate can preview and add a comment
6. On save, video is uploaded to `intro-videos` bucket
7. Database is updated with:
   - `intro_video_url` - Storage URL
   - `intro_video_comment` - Candidate's comment
   - `video_uploaded_at` - Upload timestamp
   - `video_expires_at` - Timestamp + 14 days

### When a Recruiter Views Candidates:

1. Recruiter sees a "Video" badge on candidates who have uploaded videos
2. Clicking "Watch" opens a modal with the video player
3. Recruiter can download the video for permanent storage

### Auto-Cleanup (Daily Cron):

1. Cron job triggers the edge function daily
2. Function queries for videos where `video_expires_at < now()`
3. Deletes files from storage bucket
4. Clears database fields for those candidates

## Security Considerations

1. Videos are stored with unique filenames (timestamp + user ID)
2. Storage URLs include user ID for isolation
3. Service role key is only used in server-side edge function
4. Candidates can only delete their own videos
5. Videos auto-expire after 14 days for privacy

## Troubleshooting

### Camera Access Denied
- Ensure HTTPS is being used (required for getUserMedia)
- Check browser permissions for camera/microphone
- Some browsers require user interaction before accessing media devices

### Upload Fails
- Check storage bucket exists and policies are correct
- Verify file size is under limit (100MB for videos)
- Check Supabase storage quota

### Videos Not Playing
- Ensure bucket is set to public or proper signed URLs are generated
- Check browser supports WebM format (Chrome/Firefox/Edge)
