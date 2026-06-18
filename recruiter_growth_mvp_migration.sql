-- Recruiter Career Growth MVP migration.
-- Safe to run after the existing HireVify schema. It does not delete existing data.

create extension if not exists "pgcrypto";

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.career_growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text not null,
  recruiter_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  company_name text,
  skills text[] default '{}',
  requirements text[] default '{}',
  responsibilities text[] default '{}',
  deliverables text[] default '{}',
  duration_value integer,
  duration_unit text,
  duration_label text,
  location text,
  remote_type text,
  difficulty text,
  slots integer,
  status text default 'published',
  application_deadline date,
  start_date date,
  end_date date,
  compensation_type text,
  compensation_amount numeric,
  currency text default 'INR',
  submission_required boolean default true,
  video_required boolean default true,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
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

update public.career_growth_opportunities
set
  description = coalesce(description, title, 'Career growth opportunity'),
  duration_value = coalesce(duration_value, 1),
  duration_unit = coalesce(duration_unit, case when type = 'micro_internship' then 'day' else 'week' end),
  duration_label = coalesce(duration_label, case when type = 'micro_internship' then '1 day' else '1 week' end),
  skills = coalesce(skills, '{}'),
  requirements = coalesce(requirements, '{}'),
  responsibilities = coalesce(responsibilities, '{}'),
  deliverables = coalesce(deliverables, '{}'),
  remote_type = coalesce(remote_type, 'remote'),
  status = coalesce(status, 'published'),
  currency = coalesce(currency, 'INR'),
  submission_required = coalesce(submission_required, true),
  video_required = coalesce(video_required, true)
where
  description is null
  or duration_value is null
  or duration_unit is null
  or duration_label is null
  or skills is null
  or requirements is null
  or responsibilities is null
  or deliverables is null
  or remote_type is null
  or status is null
  or currency is null
  or submission_required is null
  or video_required is null;

alter table public.career_growth_opportunities
  alter column description set not null,
  alter column duration_value set not null,
  alter column duration_unit set not null,
  alter column duration_label set not null;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.career_growth_opportunities'::regclass
      and contype = 'c'
      and conname like '%type%'
  loop
    execute format('alter table public.career_growth_opportunities drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.career_growth_opportunities
  drop constraint if exists career_growth_opportunities_type_check,
  drop constraint if exists career_growth_opportunities_status_check,
  drop constraint if exists career_growth_opportunities_remote_type_check,
  drop constraint if exists career_growth_opportunities_duration_unit_check,
  drop constraint if exists career_growth_duration_by_type_check;

alter table public.career_growth_opportunities
  add constraint career_growth_opportunities_type_check
    check (type in ('experience_builder', 'micro_internship', 'mentorship', 'career_switch')),
  add constraint career_growth_opportunities_status_check
    check (status in ('draft', 'published', 'paused', 'closed')),
  add constraint career_growth_opportunities_remote_type_check
    check (remote_type is null or remote_type in ('remote', 'onsite', 'hybrid')),
  add constraint career_growth_opportunities_duration_unit_check
    check (duration_unit in ('day', 'week', 'month')),
  add constraint career_growth_duration_by_type_check
    check (
      (type = 'experience_builder' and (
        (duration_unit = 'week' and duration_value between 1 and 3)
        or (duration_unit = 'month' and duration_value = 1)
      ))
      or
      (type = 'micro_internship' and (
        (duration_unit = 'day' and duration_value in (1, 2, 3, 5))
        or (duration_unit = 'week' and duration_value = 1)
      ))
      or type in ('mentorship', 'career_switch')
    );

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

alter table public.career_growth_applications
  drop constraint if exists career_growth_applications_status_check;

alter table public.career_growth_applications
  add constraint career_growth_applications_status_check
    check (status in ('applied', 'reviewing', 'shortlisted', 'assigned', 'rejected', 'withdrawn', 'completed', 'screening', 'accepted', 'in_progress'));

create table if not exists public.career_growth_submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.career_growth_applications(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  submission_url text,
  file_url text,
  video_url text,
  status text default 'submitted' check (status in ('draft', 'submitted', 'reviewed', 'accepted', 'revision_requested')),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  recruiter_feedback text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.job_project_challenges (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  recruiter_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  instructions text,
  skills text[] default '{}',
  estimated_duration text,
  difficulty text,
  deliverables text[] default '{}',
  attachment_url text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.assigned_projects (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  challenge_id uuid references public.job_project_challenges(id) on delete set null,
  recruiter_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(id) on delete cascade,
  instructions text,
  status text default 'assigned' check (status in ('assigned', 'in_progress', 'submitted', 'reviewed', 'accepted', 'rejected')),
  assigned_at timestamptz default now(),
  due_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  assigned_project_id uuid not null references public.assigned_projects(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(id) on delete cascade,
  submission_text text,
  submission_url text,
  file_url text,
  video_url text,
  status text default 'submitted',
  submitted_at timestamptz default now(),
  recruiter_feedback text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  career_growth_application_id uuid references public.career_growth_applications(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_cgo_recruiter_type_status on public.career_growth_opportunities(recruiter_id, type, status);
create index if not exists idx_cga_opportunity_id on public.career_growth_applications(opportunity_id);
create index if not exists idx_cga_candidate_profile_id on public.career_growth_applications(candidate_profile_id);
create index if not exists idx_cgs_application_id on public.career_growth_submissions(application_id);
create index if not exists idx_job_project_challenges_job_id on public.job_project_challenges(job_id);
create index if not exists idx_assigned_projects_application_id on public.assigned_projects(application_id);
create index if not exists idx_project_submissions_assigned_project_id on public.project_submissions(assigned_project_id);
create index if not exists idx_conversation_threads_participants on public.conversation_threads(recruiter_profile_id, candidate_profile_id);
create index if not exists idx_conversation_messages_thread_id on public.conversation_messages(thread_id, created_at);

alter table public.career_growth_opportunities enable row level security;
alter table public.career_growth_applications enable row level security;
alter table public.career_growth_submissions enable row level security;
alter table public.job_project_challenges enable row level security;
alter table public.assigned_projects enable row level security;
alter table public.project_submissions enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.conversation_messages enable row level security;

drop policy if exists "career growth opportunities readable" on public.career_growth_opportunities;
create policy "career growth opportunities readable"
on public.career_growth_opportunities for select to authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.id = career_growth_opportunities.recruiter_id
  )
);

drop policy if exists "recruiters manage own career growth opportunities" on public.career_growth_opportunities;
create policy "recruiters manage own career growth opportunities"
on public.career_growth_opportunities for all to authenticated
using (exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.id = career_growth_opportunities.recruiter_id))
with check (exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.id = career_growth_opportunities.recruiter_id and p.role = 'recruiter'));

drop policy if exists "career growth applications readable" on public.career_growth_applications;
create policy "career growth applications readable"
on public.career_growth_applications for select to authenticated
using (
  exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.id = career_growth_applications.candidate_profile_id)
  or exists (
    select 1
    from public.career_growth_opportunities o
    join public.profiles p on p.id = o.recruiter_id
    where o.id = career_growth_applications.opportunity_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "candidates apply career growth" on public.career_growth_applications;
create policy "candidates apply career growth"
on public.career_growth_applications for insert to authenticated
with check (exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.id = career_growth_applications.candidate_profile_id and p.role = 'candidate'));

drop policy if exists "recruiters update career growth applications" on public.career_growth_applications;
create policy "recruiters update career growth applications"
on public.career_growth_applications for update to authenticated
using (
  exists (
    select 1
    from public.career_growth_opportunities o
    join public.profiles p on p.id = o.recruiter_id
    where o.id = career_growth_applications.opportunity_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.career_growth_opportunities o
    join public.profiles p on p.id = o.recruiter_id
    where o.id = career_growth_applications.opportunity_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "career growth submissions participant access" on public.career_growth_submissions;
create policy "career growth submissions participant access"
on public.career_growth_submissions for all to authenticated
using (true)
with check (true);

drop policy if exists "job project challenges authenticated access" on public.job_project_challenges;
create policy "job project challenges authenticated access"
on public.job_project_challenges for all to authenticated
using (true)
with check (true);

drop policy if exists "assigned projects authenticated access" on public.assigned_projects;
create policy "assigned projects authenticated access"
on public.assigned_projects for all to authenticated
using (true)
with check (true);

drop policy if exists "project submissions authenticated access" on public.project_submissions;
create policy "project submissions authenticated access"
on public.project_submissions for all to authenticated
using (true)
with check (true);

drop policy if exists "conversation threads authenticated access" on public.conversation_threads;
create policy "conversation threads authenticated access"
on public.conversation_threads for all to authenticated
using (true)
with check (true);

drop policy if exists "conversation messages authenticated access" on public.conversation_messages;
create policy "conversation messages authenticated access"
on public.conversation_messages for all to authenticated
using (true)
with check (true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'career_growth_opportunities',
    'career_growth_applications',
    'career_growth_submissions',
    'job_project_challenges',
    'assigned_projects',
    'project_submissions'
  ]
  loop
    execute format('drop trigger if exists update_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger update_%I_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', table_name, table_name);
  end loop;
end $$;

grant select, insert, update, delete on
  public.career_growth_opportunities,
  public.career_growth_applications,
  public.career_growth_submissions,
  public.job_project_challenges,
  public.assigned_projects,
  public.project_submissions,
  public.conversation_threads,
  public.conversation_messages
to authenticated;

insert into storage.buckets (id, name, public)
values
  ('project-submissions', 'project-submissions', false),
  ('career-growth-submissions', 'career-growth-submissions', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
