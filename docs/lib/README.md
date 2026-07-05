# lib

## 역할

화면과 독립적인 데이터/유틸 계층.

## 하위 기능

- `supabase/` : Supabase 클라이언트 생성 (browser / server / middleware 용)
- `data/` : `useDailyReport` 훅. 선택 날짜의 Entry(+링크/KPT/To-do 연결), Task/Project/Subtype, 컬럼 폭 설정의 조회와 낙관적 CRUD
- `time/` : 시간 계산과 표기. `HH:MM` 포맷, 사람이 읽는 포맷(`13h 35m`), 겹침 검출, tracked/untracked(gap rule) 계산, 날짜 라벨(요일은 date-fns로 계산)
- `types/` : DB 행 타입(`database.ts`)과 Type/Status/Priority 표시 메타(`meta.ts`, 디자인 원본 색상)
- `analytics/` : `track(event, props)` 이벤트 트래킹 유틸. 이벤트 9개 상수, 허용 목록 외 속성 차단 (KAN-12)

## 규칙

- Duration은 저장하지 않고 `start_at`/`end_at`에서 계산합니다.
- Untracked = 첫 기록 시작과 마지막 기록 종료 사이의 빈 시간 (24시간 기준 아님).
- 자정 넘김 Entry는 시작 날짜(report_date)에 속합니다.

## 삭제 규칙 (KAN-23)

- Project 삭제는 소프트 삭제입니다. `projects.deleted_at`만 기록하고 행은 남깁니다.
  - Entry/Task의 `project_id`는 유지합니다 (기록 보존). 조회에서 삭제된 프로젝트가 빠지므로 화면에서는 칩이 비어 보입니다.
  - `deleted_at`을 null로 되돌리면 기존 연결이 그대로 복구됩니다.
- To-do 삭제도 소프트 삭제입니다. `tasks.deleted_at`만 기록하고 행은 남깁니다.
  - `entry_tasks` 연결 행은 지우지 않습니다 (기록 보존). 목록과 Entry 연결 칩 모두에서 숨깁니다.
  - `deleted_at`을 null로 되돌리면 Entry 연결까지 그대로 복구됩니다.
- KPT+ 삭제도 소프트 삭제입니다. `kpt_notes.deleted_at`만 기록하고 행은 남깁니다.
  - `(user_id, entry_id)` unique 행을 재사용하므로, 같은 Entry에 다시 저장하면 upsert가 `deleted_at`을 null로 되돌립니다.
  - 이때 이전 내용이 되살아나지 않도록 KPT 패널은 네 필드를 모두 덮어씁니다.
- Entry와 Link 삭제는 기존 동작대로 하드 삭제입니다 (KAN-23 범위 밖, 알려진 제한).

## 변경 로그

- 2026-07-04: Daily Report MVP 데이터 계층 생성
- 2026-07-05: Project 수정/소프트 삭제 추가 (KAN-23)
- 2026-07-05: To-do 수정 폼/소프트 삭제 추가 (KAN-23)
- 2026-07-05: KPT+ 소프트 삭제 추가 (KAN-23)
- 2026-07-06: analytics 트래킹 유틸 추가 (KAN-12)
