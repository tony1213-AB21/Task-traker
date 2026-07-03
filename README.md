# Daily Report

실제 시간 사용을 기록하고 프로젝트, To-do, 링크, KPT+ 회고, 간단한 분석을 연결하는 데스크톱 우선 개인 운영 로그입니다.

- Daily Report 표가 첫 화면이자 중심 화면입니다.
- 오른쪽 패널(Detail / KPT+ / To-do / Analysis / Projects)이 선택한 Entry를 편집하고 해석합니다.
- KPT+는 하루 요약이 아니라 선택한 Entry에 붙습니다.
- 로그인은 **Google OAuth 전용**입니다. (Supabase 이메일 발송 rate limit 때문에 이메일 magic link 로그인 UI는 제공하지 않습니다.)

## 기술 스택

Next.js (App Router) · TypeScript · Supabase (Auth + Postgres + RLS) · TanStack Table · Tailwind CSS · date-fns · Recharts

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 준비

1. [Supabase](https://supabase.com/dashboard)에서 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다. (테이블 + RLS 정책 + 프로필 트리거)
   - Supabase CLI를 쓴다면 `supabase/migrations/0001_initial_schema.sql`을 `supabase db push`로 적용해도 됩니다.
3. **Google OAuth 활성화** (유일한 로그인 방식):
   - [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 OAuth 2.0 클라이언트 ID를 만듭니다. (Application type: Web application)
   - Authorized redirect URI에 `https://<project-ref>.supabase.co/auth/v1/callback`을 추가합니다.
   - 발급된 **Client ID / Client Secret**을 Supabase → Authentication → Sign In / Providers → **Google**에 입력하고 활성화합니다. (Client Secret은 Supabase Dashboard에만 저장하며 코드/`.env`/GitHub에 넣지 않습니다.)
   - Supabase → Authentication → URL Configuration의 Redirect URLs에 `http://localhost:3000/auth/callback`(로컬)과 배포 도메인의 `/auth/callback`을 추가합니다.

### 3. 환경변수

`.env.example`을 `.env.local`(또는 `.env`)로 복사하고 값을 채웁니다.

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
```

실제 비밀값은 커밋하지 마세요. (`.gitignore`가 `.env*`를 제외합니다)

### 4. 개발 서버

```bash
npm run dev
```

`http://localhost:3000` → 로그인 화면 → **Google로 계속하기** → `/auth/callback` → `/app`.

### 5. (선택) 데모 데이터

로그인(가입)한 뒤 Supabase SQL Editor에서 `supabase/seed.sql`을 실행하면 2026-07-03 날짜에 데모 기록이 채워집니다. **로컬/개발 환경 전용입니다.**

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 검사 |

## 배포

Vercel 등 Next.js 호환 플랫폼에 배포할 수 있습니다. 환경변수 두 개를 플랫폼에 설정하고, Supabase Auth의 Site URL/Redirect URL에 배포 도메인(`https://<domain>/auth/confirm`)을 추가하세요.

## 데이터베이스

- 스키마/RLS: `supabase/schema.sql` (= `supabase/migrations/0001_initial_schema.sql`)
- 데모 시드: `supabase/seed.sql`
- 모든 사용자 데이터 테이블에 `user_id` 기반 RLS가 적용되어 있습니다.

## 개발 환경 노트

- 이 저장소가 FAT32/exFAT 드라이브에 있으면 Node `readlink`가 EISDIR을 반환해 Next.js 빌드가 깨집니다. `npm run dev/build/lint`는 `scripts/next-fat32.cjs` 래퍼를 통해 이를 자동 보정합니다. NTFS에서는 아무 영향이 없습니다.

## 알려진 제한 (v1)

- Continuous day scroll(가상화된 연속 스크롤)은 날짜 내비게이션 + sticky day divider + 이전/다음 날 collapsed preview로 대체했습니다. (목표 문서의 MVP fallback 허용 범위)
- 주간 KPT 다이제스트는 placeholder입니다.
- Subtype 이름 변경/보관 UI는 v1.1로 미뤘습니다. (생성은 가능)
- CSV export는 미구현입니다. (목표 문서에서 optional)
- 전체 분석/전체 프로젝트 페이지는 단순 페이지입니다.
- To-do의 "타이머 시작"은 미구현입니다. (목표 문서에서 optional)

## 검증

라이브 Supabase 대상 E2E 검증 결과는 `docs/verification/2026-07-04-e2e-report.md`에 있습니다. (인증·CRUD 19/19, 교차 사용자 RLS, 시간 로직 17/17, build/typecheck/lint 통과)

문서 구조와 개발 원칙은 `AGENTS.md`, 요구사항은 `goal/DAILY_REPORT_BUILD_GOAL.md`를 참고하세요.
