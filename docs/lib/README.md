# lib

## 역할

화면과 독립적인 데이터/유틸 계층.

## 하위 기능

- `supabase/` : Supabase 클라이언트 생성 (browser / server / middleware 용)
- `data/` : `useDailyReport` 훅. 선택 날짜의 Entry(+링크/KPT/To-do 연결), Task/Project/Subtype, 컬럼 폭 설정의 조회와 낙관적 CRUD
- `time/` : 시간 계산과 표기. `HH:MM` 포맷, 사람이 읽는 포맷(`13h 35m`), 겹침 검출, tracked/untracked(gap rule) 계산, 날짜 라벨(요일은 date-fns로 계산)
- `types/` : DB 행 타입(`database.ts`)과 Type/Status/Priority 표시 메타(`meta.ts`, 디자인 원본 색상)

## 규칙

- Duration은 저장하지 않고 `start_at`/`end_at`에서 계산합니다.
- Untracked = 첫 기록 시작과 마지막 기록 종료 사이의 빈 시간 (24시간 기준 아님).
- 자정 넘김 Entry는 시작 날짜(report_date)에 속합니다.

## 변경 로그

- 2026-07-04: Daily Report MVP 데이터 계층 생성
