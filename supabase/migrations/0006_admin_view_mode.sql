-- KAN-26: Admin 조회 모드 (docs/adr/0003-admin-view-mode.md)
-- admin_users에 등록된 계정만 다른 사용자의 데이터를 "조회"할 수 있다.
-- SELECT 정책만 확장한다. INSERT/UPDATE/DELETE는 소유자 전용 그대로 —
-- Admin은 DB 계층에서 구조적으로 조회 전용이다.
--
-- 🚨 실서비스 전환 시: admin_users의 모든 행을 삭제해 Admin의 개인 데이터
-- 접근을 차단할 것 (Internal Test Checklist P0 항목과 연동).

-- 1. admin_users: 행 추가/제거는 SQL Editor에서만 수행한다 (UI 없음)
--    예: insert into public.admin_users (user_id) values ('<운영자 uuid>');
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- 본인이 admin인지 확인하는 용도로만 조회 허용 (목록 노출 방지)
create policy "Users can view own admin row"
on public.admin_users for select
using (auth.uid() = user_id);

-- 2. is_admin(): RLS 정책 안에서 admin 여부를 판정하는 security definer 함수
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- 3. 데이터 테이블 SELECT 정책 확장 (본인 또는 admin)

drop policy "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

drop policy "Users can view own projects" on public.projects;
create policy "Users can view own projects"
on public.projects for select
using (auth.uid() = user_id or public.is_admin());

drop policy "Users can view own subtypes" on public.subtypes;
create policy "Users can view own subtypes"
on public.subtypes for select
using (auth.uid() = user_id or public.is_admin());

drop policy "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
on public.tasks for select
using (auth.uid() = user_id or public.is_admin());

drop policy "Users can view own entries" on public.entries;
create policy "Users can view own entries"
on public.entries for select
using (auth.uid() = user_id or public.is_admin());

drop policy "Users can view own entry_tasks" on public.entry_tasks;
create policy "Users can view own entry_tasks"
on public.entry_tasks for select
using (auth.uid() = user_id or public.is_admin());

drop policy "Users can view own entry_links" on public.entry_links;
create policy "Users can view own entry_links"
on public.entry_links for select
using (auth.uid() = user_id or public.is_admin());

drop policy "Users can view own kpt_notes" on public.kpt_notes;
create policy "Users can view own kpt_notes"
on public.kpt_notes for select
using (auth.uid() = user_id or public.is_admin());

-- user_preferences는 확장하지 않는다 (컬럼 폭 등 본인 설정만 사용)
