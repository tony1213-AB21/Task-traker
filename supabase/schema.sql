-- Daily Report MVP schema
-- Supabase SQL Editor 또는 `supabase db push`(migrations 사용 시)로 실행하세요.
-- 이 파일은 supabase/migrations/ 전체를 반영한 단일 파일입니다.

-- ============================================================
-- 1. profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 회원가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. projects
-- ============================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  org_name text,
  status text not null default 'active',
  color text,
  description text,
  -- 소프트 삭제 (KAN-23): 행을 지우지 않고 타임스탬프만 기록. Entry/Task의 project_id는 유지.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
on public.projects for select
using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.projects for insert
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.projects for delete
using (auth.uid() = user_id);

-- ============================================================
-- 3. subtypes
-- ============================================================
create table if not exists public.subtypes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type_key text not null,
  name text not null,
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, type_key, name)
);

alter table public.subtypes enable row level security;

create policy "Users can view own subtypes"
on public.subtypes for select
using (auth.uid() = user_id);

create policy "Users can insert own subtypes"
on public.subtypes for insert
with check (auth.uid() = user_id);

create policy "Users can update own subtypes"
on public.subtypes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own subtypes"
on public.subtypes for delete
using (auth.uid() = user_id);

-- ============================================================
-- 4. tasks
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  list text not null default 'today',
  priority text not null default 'medium',
  status text not null default 'not_started',
  due_date date,
  estimated_minutes integer,
  completed_at timestamptz,
  -- 소프트 삭제 (KAN-23): 행을 지우지 않고 타임스탬프만 기록. entry_tasks 연결 행은 유지.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
on public.tasks for select
using (auth.uid() = user_id);

create policy "Users can insert own tasks"
on public.tasks for insert
with check (auth.uid() = user_id);

create policy "Users can update own tasks"
on public.tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
on public.tasks for delete
using (auth.uid() = user_id);

-- ============================================================
-- 5. entries
-- ============================================================
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  type_key text not null,
  subtype_id uuid references public.subtypes(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  content text,
  status text not null default 'done',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_time_order check (end_at > start_at)
);

create index if not exists entries_user_date_idx
  on public.entries (user_id, report_date);

alter table public.entries enable row level security;

create policy "Users can view own entries"
on public.entries for select
using (auth.uid() = user_id);

create policy "Users can insert own entries"
on public.entries for insert
with check (auth.uid() = user_id);

create policy "Users can update own entries"
on public.entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own entries"
on public.entries for delete
using (auth.uid() = user_id);

-- ============================================================
-- 6. entry_tasks (Entry <-> Task 다대다)
-- ============================================================
create table if not exists public.entry_tasks (
  entry_id uuid not null references public.entries(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, task_id)
);

alter table public.entry_tasks enable row level security;

create policy "Users can view own entry_tasks"
on public.entry_tasks for select
using (auth.uid() = user_id);

create policy "Users can insert own entry_tasks"
on public.entry_tasks for insert
with check (auth.uid() = user_id);

create policy "Users can update own entry_tasks"
on public.entry_tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own entry_tasks"
on public.entry_tasks for delete
using (auth.uid() = user_id);

-- ============================================================
-- 7. entry_links
-- ============================================================
create table if not exists public.entry_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  title text not null,
  url text not null,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entry_links enable row level security;

create policy "Users can view own entry_links"
on public.entry_links for select
using (auth.uid() = user_id);

create policy "Users can insert own entry_links"
on public.entry_links for insert
with check (auth.uid() = user_id);

create policy "Users can update own entry_links"
on public.entry_links for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own entry_links"
on public.entry_links for delete
using (auth.uid() = user_id);

-- ============================================================
-- 8. kpt_notes (Entry 단위 KPT+)
-- ============================================================
create table if not exists public.kpt_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  keep_text text,
  problem_text text,
  try_text text,
  plus_text text,
  -- 소프트 삭제 (KAN-23): 재저장 시 upsert가 null로 되돌려 행을 재사용.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_id)
);

alter table public.kpt_notes enable row level security;

create policy "Users can view own kpt_notes"
on public.kpt_notes for select
using (auth.uid() = user_id);

create policy "Users can insert own kpt_notes"
on public.kpt_notes for insert
with check (auth.uid() = user_id);

create policy "Users can update own kpt_notes"
on public.kpt_notes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own kpt_notes"
on public.kpt_notes for delete
using (auth.uid() = user_id);

-- ============================================================
-- 9. user_preferences (컬럼 폭 등 UI 설정)
-- ============================================================
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  column_widths jsonb not null default '{}',
  density text not null default 'compact',
  default_report_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view own preferences"
on public.user_preferences for select
using (auth.uid() = user_id);

create policy "Users can insert own preferences"
on public.user_preferences for insert
with check (auth.uid() = user_id);

create policy "Users can update own preferences"
on public.user_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own preferences"
on public.user_preferences for delete
using (auth.uid() = user_id);
