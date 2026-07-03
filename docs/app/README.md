# app 라우트

## 역할

Next.js App Router 라우트 구조. 인증 여부에 따라 화면을 나눕니다.

## 라우트

- `/` : 인증 상태에 따라 `/app` 또는 `/login`으로 리다이렉트
- `/login` : Google OAuth 전용 로그인 화면
- `/auth/callback` : Google OAuth code를 세션으로 교환 후 `/app` 이동 (Route Handler)
- `/auth/confirm` : 이메일 magic link 토큰 검증 라우트 (현재 로그인 UI에서 미사용, 엔드포인트만 유지)
- `/app` : Daily Report 메인 화면 (보호 라우트, 로그인 필수)
- `/app/analysis` : 전체 분석 페이지 (v1 단순 페이지)
- `/app/projects` : 전체 프로젝트 페이지 (v1 단순 페이지)

## 보호 방식

- `src/middleware.ts` 가 모든 요청에서 Supabase 세션을 갱신하고 `/app` 접근을 차단
- `src/app/app/layout.tsx` 가 서버에서 세션을 재확인

## 변경 로그

- 2026-07-04: Daily Report MVP 라우트 구조 생성
- 2026-07-04: Google OAuth 로그인(기본) 추가, `/auth/callback` 라우트 신설, 이메일 로그인은 보조로 이동
- 2026-07-04: 로그인을 Google OAuth 전용으로 변경, 이메일 magic link 로그인 UI 제거
