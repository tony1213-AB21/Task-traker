-- KAN-23: To-do(tasks) 소프트 삭제
-- 삭제는 행을 지우지 않고 deleted_at 타임스탬프만 기록한다.
-- 연결 데이터 규칙: entry_tasks 연결 행은 유지한다 (기록 보존).
-- 앱 조회는 deleted_at is null 로 필터링하고 Entry 연결 칩에서도 숨기며,
-- deleted_at을 null로 되돌리면 연결이 그대로 복구된다.

alter table public.tasks
  add column if not exists deleted_at timestamptz;
