-- Fix missing career growth columns on an existing Supabase database.
-- Run this in the Supabase SQL editor, then retry the recruiter posting flow.

alter table public.career_growth_opportunities
  add column if not exists responsibilities text[] default '{}',
  add column if not exists deliverables text[] default '{}',
  add column if not exists duration_value integer,
  add column if not exists duration_unit text,
  add column if not exists application_deadline date,
  add column if not exists compensation_type text,
  add column if not exists compensation_amount numeric,
  add column if not exists currency text default 'INR',
  add column if not exists submission_required boolean default true,
  add column if not exists video_required boolean default true;

alter table public.career_growth_applications
  add column if not exists cover_message text,
  add column if not exists assigned_at timestamptz;

update public.career_growth_opportunities
set
  skills = coalesce(skills, '{}'),
  requirements = coalesce(requirements, '{}'),
  responsibilities = coalesce(responsibilities, '{}'),
  deliverables = coalesce(deliverables, '{}'),
  currency = coalesce(currency, 'INR'),
  submission_required = coalesce(submission_required, true),
  video_required = coalesce(video_required, true)
where
  skills is null
  or requirements is null
  or responsibilities is null
  or deliverables is null
  or currency is null
  or submission_required is null
  or video_required is null;

-- Refresh PostgREST/Supabase schema cache so new columns are visible to the API.
notify pgrst, 'reload schema';
