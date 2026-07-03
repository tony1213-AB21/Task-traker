# Next.js + Supabase 스택과 인증/RLS 모델 채택

## 상태

Accepted

## 맥락

Daily Report MVP는 개인용 시간 기록 앱으로, 이메일 인증, 사용자별 데이터 격리, 관계형 데이터(Entry/Task/Project/Link/KPT), 데스크톱 우선 표 UI가 필요합니다. `goal/DAILY_REPORT_BUILD_GOAL.md`가 추천 스택을 명시하고 있었습니다.

## 결정

- Next.js App Router + TypeScript + Tailwind CSS로 프론트엔드를 구성합니다.
- Supabase를 인증(이메일 magic link/OTP)과 Postgres 데이터베이스로 사용합니다.
- 클라이언트 키는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 사용하고, service role 키는 프론트엔드에서 사용하지 않습니다.
- 모든 사용자 데이터 테이블에 `user_id` 컬럼과 RLS(select/insert/update/delete own rows)를 적용합니다.
- 세션 관리는 `@supabase/ssr` 쿠키 기반으로 하고, `src/middleware.ts`에서 세션 갱신과 `/app` 보호를 수행합니다.
- 데이터 접근은 서버 API 레이어 없이 클라이언트에서 Supabase에 직접 질의합니다. RLS가 권한 경계입니다.
- 표는 TanStack Table, 날짜 계산은 date-fns, 차트는 Recharts를 사용합니다.
- Duration은 저장하지 않고 `start_at`/`end_at`에서 계산합니다. Entry↔Task 연결은 다대다(`entry_tasks`)로 만듭니다.

## 결과

장점:

- RLS가 데이터 격리를 DB 계층에서 보장하므로 별도 백엔드 없이 MVP를 완성할 수 있습니다.
- 쿠키 기반 세션으로 서버 컴포넌트/미들웨어에서 일관된 인증 확인이 가능합니다.
- 다대다 연결로 이후 "하나의 To-do에 여러 Entry" 시나리오를 스키마 변경 없이 지원합니다.

단점:

- 클라이언트 직접 질의 구조라 복잡한 서버 로직(집계, 배치)이 필요해지면 API 레이어를 추가해야 합니다.
- Supabase에 인증/DB가 결합되어 이후 이전 비용이 있습니다.

트레이드오프:

- 서버 API 레이어를 두면 유연하지만 MVP 범위에서는 과합니다. RLS + 클라이언트 질의가 가장 적은 코드로 요구사항을 만족합니다.
