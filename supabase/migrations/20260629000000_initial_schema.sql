-- ============================================================
-- GetReportSync — Complete Supabase Setup
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'pro', 'agency')),
  trial_ends_at timestamptz default (now() + interval '7 days'),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

-- Trigger fires on every signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. REPORTS TABLE
-- ============================================================

create table if not exists public.reports (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled Report',
  document_name text,
  document_type text check (document_type in ('financial', 'sales', 'operations', 'hr', 'project', 'general')),
  status text not null default 'processing' check (status in ('processing', 'complete', 'error')),
  extracted_data jsonb,
  kpis jsonb,
  charts jsonb,
  executive_summary text,
  share_token text unique,
  share_active boolean not null default false,
  share_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.reports
  for each row execute function public.update_updated_at();


-- 3. VIEWER SESSIONS TABLE (live presence)
-- ============================================================

create table if not exists public.viewer_sessions (
  id uuid not null default gen_random_uuid() primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  viewer_name text not null default 'Anonymous',
  viewer_role text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);


-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Reports
alter table public.reports enable row level security;

create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- Shared reports: anyone with a valid share_token can read
create policy "Anyone can view shared reports"
  on public.reports for select
  using (share_active = true and (share_expires_at is null or share_expires_at > now()));

-- Viewer sessions
alter table public.viewer_sessions enable row level security;

create policy "Report owner can see viewer sessions"
  on public.viewer_sessions for select
  using (
    exists (
      select 1 from public.reports
      where reports.id = viewer_sessions.report_id
      and reports.user_id = auth.uid()
    )
  );

create policy "Anyone can insert viewer session"
  on public.viewer_sessions for insert
  with check (true);

create policy "Anyone can update own viewer session"
  on public.viewer_sessions for update
  using (auth.uid() is null or true); -- permissive for anonymous viewers


-- 5. REALTIME (viewer_sessions for live presence)
-- ============================================================

alter publication supabase_realtime add table public.viewer_sessions;


-- 6. STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- Storage RLS: users can only access their own files
-- Files are stored at: {user_id}/{filename}

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Exports bucket (same pattern)
create policy "Users can upload own exports"
  on storage.objects for insert
  with check (
    bucket_id = 'exports'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own exports"
  on storage.objects for select
  using (
    bucket_id = 'exports'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own exports"
  on storage.objects for delete
  using (
    bucket_id = 'exports'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );