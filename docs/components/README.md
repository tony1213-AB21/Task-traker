# components

## 역할

Daily Report 화면을 이루는 기능 단위 컴포넌트. 폴더가 기능 경계입니다.

## 하위 기능

- `app-shell/` : 메인 화면 컨테이너(`DailyReportScreen`)와 상단 바(`TopBar`). 날짜/선택/탭/검색 상태 소유
- `daily-report-table/` : 메인 표(`EntryTable`). TanStack Table 기반 컬럼 리사이즈/auto-fit/폭 저장, 선택, 겹침 경고
- `right-panel/` : 오른쪽 컨텍스트 패널 컨테이너(`RightPanel`)와 Detail 패널(`DetailPanel`)
- `kpt/` : Entry 단위 KPT+ 패널. Plus → To-do 전환 포함
- `todo/` : Today/Backlog To-do 패널. 선택 Entry에 명시적 연결
- `analysis/` : 컴팩트 Analysis 패널. Untracked는 gap rule로 계산
- `projects/` : 프로젝트 카드 패널 (Org 메타데이터 포함)
- `auth/` : 로그인 카드 (magic link / OTP)
- `ui/` : Type/Status/Priority pill, Project/To-do 칩 등 공용 표시 요소

## 데이터 흐름

`DailyReportScreen` 이 `useDailyReport` 훅(모든 CRUD)을 소유하고 각 패널에 내려보냅니다.

## 변경 로그

- 2026-07-04: Daily Report MVP 컴포넌트 구조 생성
