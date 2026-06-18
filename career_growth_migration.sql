-- Career Growth Paths tables for Experience Builder, Micro-Internships,
-- Mentorship, and Career Switch.
-- Run this in Supabase SQL editor after the base HireVify schema.

create extension if not exists "pgcrypto";

create table if not exists public.career_growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('experience_builder', 'micro_internship', 'mentorship', 'career_switch')),
  title text not null,
  description text,
  company_name text,
  recruiter_id uuid references public.profiles(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  skills text[] default '{}',
  duration_label text,
  difficulty text,
  location text,
  remote_type text,
  status text default 'published',
  responsibilities text[] default '{}',
  deliverables text[] default '{}',
  duration_value integer,
  duration_unit text,
  application_deadline date,
  compensation_type text,
  compensation_amount numeric,
  currency text default 'INR',
  submission_required boolean default true,
  video_required boolean default true,
  start_date date,
  end_date date,
  slots integer,
  requirements text[] default '{}',
  benefits text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table if not exists public.career_growth_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.career_growth_opportunities(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'applied',
  cover_message text,
  message text,
  recruiter_notes text,
  assigned_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(opportunity_id, candidate_profile_id)
);

alter table public.career_growth_applications
  add column if not exists cover_message text,
  add column if not exists assigned_at timestamptz;

create index if not exists idx_career_growth_opportunities_type_status
  on public.career_growth_opportunities(type, status);
create index if not exists idx_career_growth_opportunities_recruiter_id
  on public.career_growth_opportunities(recruiter_id);
create index if not exists idx_career_growth_opportunities_created_at
  on public.career_growth_opportunities(created_at desc);
create index if not exists idx_career_growth_applications_opportunity_id
  on public.career_growth_applications(opportunity_id);
create index if not exists idx_career_growth_applications_candidate_profile_id
  on public.career_growth_applications(candidate_profile_id);
create index if not exists idx_career_growth_applications_status
  on public.career_growth_applications(status);

alter table public.career_growth_opportunities enable row level security;
alter table public.career_growth_applications enable row level security;

drop policy if exists "career_growth_opportunities_select_published_or_own" on public.career_growth_opportunities;
create policy "career_growth_opportunities_select_published_or_own"
  on public.career_growth_opportunities
  for select
  using (
    status = 'published'
    or exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_opportunities.recruiter_id
    )
    or exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_opportunities.created_by_profile_id
    )
  );

drop policy if exists "career_growth_opportunities_insert_recruiter_own" on public.career_growth_opportunities;
create policy "career_growth_opportunities_insert_recruiter_own"
  on public.career_growth_opportunities
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.role = 'recruiter'
      and p.id = coalesce(career_growth_opportunities.recruiter_id, career_growth_opportunities.created_by_profile_id)
    )
  );

drop policy if exists "career_growth_opportunities_update_recruiter_own" on public.career_growth_opportunities;
create policy "career_growth_opportunities_update_recruiter_own"
  on public.career_growth_opportunities
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_opportunities.recruiter_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_opportunities.recruiter_id
    )
  );

drop policy if exists "career_growth_opportunities_delete_recruiter_own" on public.career_growth_opportunities;
create policy "career_growth_opportunities_delete_recruiter_own"
  on public.career_growth_opportunities
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_opportunities.recruiter_id
    )
  );

drop policy if exists "career_growth_applications_select_candidate_or_recruiter" on public.career_growth_applications;
create policy "career_growth_applications_select_candidate_or_recruiter"
  on public.career_growth_applications
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_applications.candidate_profile_id
    )
    or exists (
      select 1
      from public.career_growth_opportunities o
      join public.profiles p on p.id = o.recruiter_id
      where o.id = career_growth_applications.opportunity_id
      and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "career_growth_applications_insert_candidate_own" on public.career_growth_applications;
create policy "career_growth_applications_insert_candidate_own"
  on public.career_growth_applications
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.role = 'candidate'
      and p.id = career_growth_applications.candidate_profile_id
    )
  );

drop policy if exists "career_growth_applications_update_candidate_or_recruiter" on public.career_growth_applications;
create policy "career_growth_applications_update_candidate_or_recruiter"
  on public.career_growth_applications
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_applications.candidate_profile_id
    )
    or exists (
      select 1
      from public.career_growth_opportunities o
      join public.profiles p on p.id = o.recruiter_id
      where o.id = career_growth_applications.opportunity_id
      and p.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.auth_user_id = auth.uid()
      and p.id = career_growth_applications.candidate_profile_id
    )
    or exists (
      select 1
      from public.career_growth_opportunities o
      join public.profiles p on p.id = o.recruiter_id
      where o.id = career_growth_applications.opportunity_id
      and p.auth_user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.career_growth_opportunities to authenticated;
grant select, insert, update on public.career_growth_applications to authenticated;

drop trigger if exists update_career_growth_opportunities_updated_at on public.career_growth_opportunities;
create trigger update_career_growth_opportunities_updated_at
  before update on public.career_growth_opportunities
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_career_growth_applications_updated_at on public.career_growth_applications;
create trigger update_career_growth_applications_updated_at
  before update on public.career_growth_applications
  for each row execute function public.update_updated_at_column();

insert into public.career_growth_opportunities
  (type, title, description, company_name, skills, duration_label, difficulty, location, remote_type, requirements, benefits, metadata)
select *
from (
  values
    ('experience_builder', 'Frontend Product Experience Sprint', 'Build a production-ready customer dashboard feature with review from an engineering lead.', 'HireVify Partner Network', array['React','TypeScript','UI Implementation'], '2 weeks', 'Entry Level', 'Remote', 'remote', array['Basic React knowledge','Git workflow familiarity'], array['Portfolio-ready work sample','Professional reference consideration'], '{"commitment":"12-15 hours/week","category":"Frontend Development"}'::jsonb),
    ('experience_builder', 'Data Insights Portfolio Project', 'Analyze product usage data and prepare a short findings report for a real business case.', 'Growth Analytics Partner', array['SQL','Data Analysis','Reporting'], '1 week', 'Intermediate', 'Remote', 'remote', array['SQL basics','Comfort with spreadsheets or notebooks'], array['Business analytics experience','Review feedback'], '{"commitment":"8-10 hours/week","category":"Data Analysis"}'::jsonb),
    ('micro_internship', 'Landing Page QA and Conversion Notes', 'Audit a campaign landing page, document issues, and propose quick conversion improvements.', 'Digital Growth Studio', array['QA','Marketing','UX'], '2 days', 'Beginner', 'Remote', 'remote', array['Clear written communication'], array['Short project experience','Feedback from project owner'], '{"payment":"150","category":"Marketing","deadline":"Rolling"}'::jsonb),
    ('micro_internship', 'Research List Cleanup', 'Clean and validate a small prospect research list for a go-to-market team.', 'Startup Ops Partner', array['Research','Spreadsheets','Attention to Detail'], '1 day', 'Beginner', 'Remote', 'remote', array['Spreadsheet familiarity'], array['Operations project sample','Fast completion cycle'], '{"payment":"100","category":"Operations","deadline":"Rolling"}'::jsonb),
    ('mentorship', 'Frontend Career Mentorship', 'Four guided sessions focused on portfolio review, interview preparation, and growth planning.', 'HireVify Mentors', array['React','Career Growth','Interview Prep'], '4 sessions', 'All Levels', 'Remote', 'remote', array['Bring current resume or portfolio'], array['Personalized feedback','Action plan'], '{"mentor_title":"Senior Frontend Engineer","session_format":"1-on-1 Video","price_per_session":"0"}'::jsonb),
    ('mentorship', 'Career Switch Strategy Sessions', 'Mentor-led guidance for candidates moving into product, design, analytics, or software roles.', 'HireVify Mentors', array['Career Transition','Portfolio','Planning'], '3 sessions', 'All Levels', 'Remote', 'remote', array['Define target role before first session'], array['Transition roadmap','Accountability checkpoints'], '{"mentor_title":"Career Transition Coach","session_format":"1-on-1 Video","price_per_session":"0"}'::jsonb),
    ('career_switch', 'Operations to Product Analyst Track', 'A structured path covering product metrics, SQL basics, user research, and portfolio projects.', 'HireVify Learning', array['Product Analytics','SQL','User Research'], '8 weeks', 'Beginner', 'Remote', 'remote', array['2-4 hours per week'], array['Structured milestones','Portfolio project prompts'], '{"modules":"8","projects":"2","from_careers":["Operations","Customer Support"],"to_careers":["Product Analyst"]}'::jsonb),
    ('career_switch', 'Marketing to UX Research Track', 'Build on marketing strengths while learning research planning, interviews, synthesis, and case study writing.', 'HireVify Learning', array['UX Research','Interviewing','Synthesis'], '10 weeks', 'Beginner', 'Remote', 'remote', array['2-4 hours per week'], array['Research case study','Mentorship-friendly checkpoints'], '{"modules":"10","projects":"2","from_careers":["Marketing","Content"],"to_careers":["UX Researcher"]}'::jsonb)
) as seed(type, title, description, company_name, skills, duration_label, difficulty, location, remote_type, requirements, benefits, metadata)
where not exists (select 1 from public.career_growth_opportunities);
