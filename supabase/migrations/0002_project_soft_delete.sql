-- KAN-23: Project 소프트 삭제
-- 삭제는 행을 지우지 않고 deleted_at 타임스탬프만 기록한다.
-- 연결 데이터 규칙: Entry/Task의 project_id는 유지한다 (기록 보존).
-- 앱 조회는 deleted_at is null 로 필터링하며, deleted_at을 null로 되돌리면 복구된다.

alter table public.projects
  add column if not exists deleted_at timestamptz;
