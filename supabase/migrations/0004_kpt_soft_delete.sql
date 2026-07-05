-- KAN-23: KPT+(kpt_notes) 소프트 삭제
-- 삭제는 행을 지우지 않고 deleted_at 타임스탬프만 기록한다.
-- 같은 Entry에 KPT+를 다시 저장하면 upsert가 deleted_at을 null로 되돌려
-- (user_id, entry_id) unique 행을 재사용한다. 이때 앱은 네 필드를 모두 덮어쓴다.

alter table public.kpt_notes
  add column if not exists deleted_at timestamptz;
