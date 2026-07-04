# 배포 가이드 (Vercel + Supabase)

Daily Report를 Vercel에 배포하기 위한 설정과 배포 후 점검 목록입니다.

## 1. Vercel 프로젝트 설정

GitHub 저장소(`tony1213-AB21/Task-traker`)를 Vercel에 import하면 Next.js 프리셋이 자동 적용됩니다.

| 항목 | 값 |
|---|---|
| Framework Preset | Next.js (자동 감지) |
| Install Command | `npm install` (기본값) |
| Build Command | `next build` (프레임워크 기본값) 또는 `npm run build` |
| Output | 자동 (`.next`, 서버리스/Edge) — 별도 설정 불필요 |
| Root Directory | `./` |
| Node.js Version | 20.x 이상 (React 19/Next 15 요구) |

### Build Command 관련 주의

- `package.json`의 `build` 스크립트는 `node scripts/next-fat32.cjs build`입니다. 이는 **로컬 개발 드라이브가 FAT32라서** Node `readlink`가 EISDIR을 반환하는 문제를 우회하기 위한 래퍼입니다.
- 이 래퍼는 리눅스(Vercel 빌드 환경)에서는 EISDIR이 발생하지 않으므로 **아무 동작도 하지 않는 pass-through**입니다. 따라서 `npm run build`를 그대로 써도 안전합니다.
- 그래도 명확히 하려면 Vercel의 Build Command를 **`next build`** 로 지정해도 됩니다. (FAT32 우회는 로컬 전용이므로 Vercel에서는 불필요)

### 설정 파일 점검 결과

- `next.config.ts`: 기본 설정(빈 config). `output: 'export'`/`'standalone'` 없음 → Vercel 서버 렌더링 기본 동작 사용. 미들웨어(`src/middleware.ts`)는 Edge에서 실행됨.
- `package.json` scripts: `dev` / `build` / `start` / `lint` / `typecheck` 존재.
- case-sensitivity: 모든 import 경로가 실제 파일명과 대소문자까지 일치(리눅스 빌드 안전).

## 2. 환경변수 (Vercel → Settings → Environment Variables)

**아래 2개만** 넣습니다. 둘 다 `NEXT_PUBLIC_` 접두사이며 클라이언트에 노출되어도 되는 값입니다(publishable/anon 키).

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

- Environments: Production (필요 시 Preview / Development에도 동일 값)
- **service role 키는 절대 넣지 않습니다.** 프론트엔드 코드도 요구하지 않습니다.
- `.env.local` / `.env`는 커밋하지 않습니다(`.gitignore`가 제외). 값은 Vercel 대시보드에만 입력합니다.

## 3. Google OAuth Provider 설정 (유일한 로그인)

Supabase 기본 이메일 발송 rate limit 때문에 로그인은 **Google OAuth 전용**입니다. 로그인 화면에는 이메일 magic link UI가 없습니다.

### 3.1 Google Cloud Console

1. [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)에서 **OAuth 2.0 Client ID** 생성 (Application type: **Web application**).
2. **Authorized redirect URIs**에 Supabase 콜백을 추가:
   ```text
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
   (이 URI는 Supabase가 Google로부터 code를 받는 주소이며, 앱의 `/auth/callback`과는 다릅니다.)
3. 발급된 **Client ID / Client Secret**을 복사합니다.

### 3.2 Supabase

1. Authentication → Sign In / Providers → **Google** 활성화, 위 Client ID / Client Secret 입력.
2. Client Secret은 Supabase에만 저장되며 **프론트엔드에 노출되지 않습니다.** (service role 키와 무관)

## 4. Supabase Auth URL Configuration

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://<your-vercel-domain>` (프로덕션 도메인)
- **Redirect URLs (allow list)** 에 추가:
  - `https://<your-vercel-domain>/auth/callback` — **Google OAuth 콜백(앱 라우트)**
  - `http://localhost:3000/auth/callback` — 로컬 개발
  - Preview 배포도 쓸 경우: `https://*.vercel.app/auth/callback` (와일드카드)

> 앱은 OAuth에서 `redirectTo = ${origin}/auth/callback`을 사용합니다. 배포 도메인의 이 경로가 allow list에 있어야 로그인이 동작합니다. 이메일 magic link는 로그인 UI에서 사용하지 않습니다(관련 `/auth/confirm` 라우트는 남아 있으나 UI에서 호출되지 않음).

## 4. 배포 후 실제 사용 테스트 체크리스트

### 인증
- [ ] 배포 도메인 접속 시 `/login`으로 리다이렉트된다.
- [ ] 로그인 화면에 **"Google로 계속하기"** 버튼만 있고 이메일 로그인 UI는 없다.
- [ ] "Google로 계속하기" → Google 동의 화면 → `/auth/callback`을 거쳐 `/app`으로 이동한다.
- [ ] Google 로그인 취소/실패 시 `/login?error=oauth`로 돌아오고 오류 메시지가 표시된다.
- [ ] 로그아웃 후 `/app` 직접 접근 시 `/login`으로 막힌다.

### 메인 표 / Entry
- [ ] `/app`에서 Daily Report 표가 보이고, 날짜 이전/오늘/다음 이동이 된다.
- [ ] 기록 추가 → 새 Entry 행이 생기고 Detail 패널에서 선택된다.
- [ ] Time/Type/Subtype/Project/Content/Status를 편집하면 저장된다(상단 "저장됨" 표시).
- [ ] Duration이 표에서 `HH:MM`으로 표시된다.
- [ ] 컬럼 경계 드래그로 폭이 조절되고, 더블클릭 시 자동 맞춤된다. 새로고침 후 폭이 유지된다.
- [ ] Entry 삭제가 동작한다.
- [ ] 시간이 겹치는 두 기록에서 행/Detail에 겹침 경고가 뜬다.

### To-do / Project / Link / KPT+
- [ ] To-do 탭에서 Today/Backlog에 할 일을 만들고 체크/해제가 된다.
- [ ] 선택한 Entry에 To-do를 "연결"하면 표와 Detail에 칩이 뜬다.
- [ ] Detail에서 링크 여러 개를 추가/삭제할 수 있다(표에는 링크 열이 아니라 개수 아이콘만).
- [ ] Project를 만들고 Org를 지정하면 Projects 탭 카드와 Detail 칩에 반영된다.
- [ ] KPT+ 탭이 "선택한 기록"에 귀속되고, Keep/Problem/Try/Plus가 저장된다.
- [ ] Plus의 "To-do로 전환"이 Backlog에 새 할 일을 만든다.

### Analysis / 라우트
- [ ] Analysis 탭에 Tracked/Untracked(gap rule)/완료율/Type·Project 분포가 나온다.
- [ ] "전체 분석 열기" → `/app/analysis`, "전체 프로젝트 열기" → `/app/projects`가 열린다(깨지지 않음).

### 보안(가능 범위)
- [ ] 다른 계정으로 로그인하면 이전 계정의 Entry/Project/To-do가 보이지 않는다.

## 5. 트러블슈팅

### 로그인 후 예전 Vue/Bulma "Task Tracker" 화면이 뜨거나, `?code=`가 루트 `/`로 돌아온다

**증상**: Google 로그인 후 `https://<domain>/?code=...#/`로 이동하고, Daily Report가 아니라 큰 "Task Tracker" 로고 / Enable Dark Mode / TASKS·PROJECTS / "There is no tasks" 같은 화면이 보인다.

**원인 (코드 아님, 인프라)**:

1. **해당 도메인이 우리 Next.js 앱이 아닌 다른 Vercel 프로젝트(옛 Vue 앱)에 연결되어 있음.** 확인법: `curl https://<domain>/app` 이 우리 앱이면 `307 → /login`이어야 하는데, 옛 앱이면 `200` + `bulma`/`chunk-vendors`가 보인다. HTML에 `_next`가 없으면 우리 앱이 아니다. (우리 저장소에는 Vue/Bulma/`chunk-vendors`/service worker/`index.html`이 전혀 없다 — `git grep`으로 확인됨.)
2. **Supabase가 redirectTo를 allow-list에서 못 찾아 Site URL(루트)로 fallback.** 그래서 `/auth/callback`이 아니라 `/?code=`로 온다. `#/`은 그 Vue 앱의 hash router가 붙인 것.

**해결 (Vercel/Supabase 대시보드)**:

1. Vercel에서 이 도메인이 가리키는 프로젝트를 **우리 저장소(`tony1213-AB21/Task-traker`)** 로 교체하거나, 우리 저장소로 새 프로젝트를 만들어 도메인을 그쪽으로 옮긴다. 환경변수는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 두 개만.
2. 재배포 후 `curl https://<domain>/login` 에 `_next`와 "Google로 계속하기"가 보이고 `chunk-vendors`/`bulma`가 없어야 한다.
3. 옛 Vue 앱의 **service worker/캐시가 브라우저에 남아 있으면** 시크릿 창으로 접속하거나, DevTools → Application → Service Workers → Unregister + Clear storage 후 새로고침한다. (우리 앱은 service worker를 등록하지 않으므로, 새 배포가 뜨면 자연히 사라진다.)
4. Supabase → Authentication → URL Configuration:
   - **Site URL** 을 우리 앱 도메인으로 설정.
   - **Redirect URLs** 에 `https://<domain>/auth/callback` 을 추가(정확히 이 경로가 allow-list에 있어야 루트 fallback 없이 `/auth/callback?code=`로 온다).

> 코드 측 안전장치: 혹시 `?code=`가 루트로 오더라도 미들웨어가 `/auth/callback?code=...`로 넘겨 세션 교환을 처리한다(`src/lib/supabase/middleware.ts`). 단, 이 안전장치는 **도메인이 우리 앱을 서빙할 때만** 동작한다.

## 6. 참고

- 스키마/RLS: `supabase/schema.sql` (SQL Editor에서 실행)
- E2E 검증 결과: `docs/verification/2026-07-04-e2e-report.md`
- 로컬 실행/환경변수: 루트 `README.md`
