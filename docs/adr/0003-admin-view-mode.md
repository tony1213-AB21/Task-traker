# Admin 조회 모드 설계 — RLS 정책 확장 방식 (KAN-26)

## 상태

Proposed (구현 전 설계 확정, 구현은 후속 묶음)

## 맥락

내부 테스트 기간에 테스트 계정들이 기록한 데이터를 운영자가 확인할 수 있는 Admin 조회 모드가 필요하다. 화면은 일반 사용 화면과 동일하되 상단에 "어떤 계정의 데이터를 볼지" 선택하는 셀렉터만 추가한다.

접근 제어 방식 후보는 두 가지였다.

1. **service role 키를 쓰는 서버 API**: Next.js 서버 라우트에서 service role로 조회하고 운영자 이메일을 검사
2. **RLS 정책 확장**: admin 계정에게만 SELECT를 추가 허용하는 정책을 DB에 추가

## 결정

**RLS 정책 확장 방식(2번)을 채택한다.** service role 키는 계속 어디에도 배포하지 않는다.

구현 규격 (후속 구현 이슈의 기준):

- `admin_users` 테이블 추가 (`user_id uuid primary key`). 행 추가/제거는 Supabase SQL Editor에서만 수행 (UI 없음)
- `is_admin()` security definer 함수: `exists (select 1 from admin_users where user_id = auth.uid())`
- 데이터 테이블(entries/tasks/projects/subtypes/entry_links/kpt_notes)의 **SELECT 정책만** `auth.uid() = user_id or is_admin()`으로 확장
- **INSERT/UPDATE/DELETE 정책은 소유자 전용 그대로 유지** → Admin은 구조적으로 조회 전용 (실수로도 수정 불가)
- 프론트: `admin_users` 조회로 admin 여부 감지 → TopBar에 계정 셀렉터 노출 → `useDailyReport`가 선택된 user_id로 필터 조회
- 계정 목록은 `profiles` 테이블 SELECT 정책도 동일하게 확장해 확보

## 결과

- 장점: service role 미배포 원칙 유지, 조회 전용이 DB 계층에서 강제됨, 앱 코드 변경 최소(쿼리 필터 + 셀렉터)
- 단점: 정책 6~7개 수정이 필요한 마이그레이션, admin 계정 관리가 SQL 수동 작업
- 트레이드오프: 서버 API 방식보다 유연성은 낮지만, 1인 운영 + 내부 테스트 용도에는 구조적 안전성이 더 중요

## 🚨 실서비스 전환 시 개인정보 차단 원칙 (KAN-26 영구 기록 연동)

이 기능은 **내부 테스트 전용**이다. 실사용자를 받는 배포 전에 반드시:

1. `admin_users`의 모든 행 삭제 또는 `is_admin()`이 항상 false를 반환하도록 마이그레이션 → Admin의 개인 데이터 접근 차단
2. Internal Test Checklist P0의 "실사용자 배포 시 Admin 개인 데이터 접근 차단 확인" 항목과 이중으로 점검
3. 실서비스 전환 Epic 생성 시 KAN-26을 해당 Epic에 링크
