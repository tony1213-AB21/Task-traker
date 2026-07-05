# lib/analytics

## 역할

Daily Report 이벤트 트래킹 공통 유틸. GA4/Amplitude에 이벤트를 일관되게 보내기 위한 단일 진입점입니다.

기준 문서: Confluence [Analytics Spec - Daily Report Events v1](https://abitus21-team.atlassian.net/wiki/x/PIAL) (KAN-12)

## 주요 파일

- `track.ts` : 이벤트명 상수(v1 9개), 이벤트별 허용 속성 타입, `track(event, props)` 함수, `durationBucket()` 헬퍼

## 설계 요점

- **이벤트명 상수**: 스펙의 9개(`app_opened` ~ `analysis_viewed`)만 존재합니다. 새 이벤트는 스펙 문서에 먼저 추가한 뒤 코드에 반영합니다.
- **공통 속성 자동 주입**: `date_bucket`(weekday/weekend), `device_type`(desktop/mobile/tablet), `user_role`(v1은 owner 고정), `env`(production/preview/development)는 `track()`이 항상 채우며 호출자가 덮어쓸 수 없습니다. localhost/preview 이벤트는 `env` 속성으로 분리합니다.
- **금지 속성 방어 (함수 레벨 차단)**:
  - 자유 텍스트(content, title, memo 등)는 마스킹이 아니라 **미전송**입니다. 이벤트별 허용 목록에 없는 속성은 payload에서 제거되고 경고 로그를 남깁니다.
  - 문자열 속성(project_type, work_type, duration_bucket)은 허용 값 목록까지 검사합니다. 허용 값 밖 문자열(예: 실제 회사명)은 project_type/work_type의 경우 `etc`로 강제되고, 그 외에는 버려집니다.
  - 객체/배열 등 원시값이 아닌 값은 전송하지 않습니다.
- **성공 기준 시점 발화**: 클릭 시점이 아니라 저장 성공/렌더 완료 시점에만 `track()`을 호출합니다. 실패 시에는 호출하지 않습니다.
- **전송기**: GA4(`window.gtag`)가 로드되어 있으면 전송, 아니면 no-op (개발 환경에서는 console.debug). GA4 measurement ID 발급 전에도 삽입 코드가 안전하게 동작합니다.

## 삽입 위치 후보 (스펙 3번 × 현재 코드)

실제 삽입은 후속 작업입니다 (Funnel A 4종 먼저 → DebugView 검증 → 나머지 5종).

| 이벤트 | 성공 기준 | 삽입 위치 후보 |
| --- | --- | --- |
| `app_opened` | 앱 첫 로드 완료 | `DailyReportScreen` 최초 mount (`src/components/app-shell/DailyReportScreen.tsx`) |
| `login_completed` | 인증 성공 응답 수신 후 | `/auth/callback`은 서버 라우트라 직접 발화 불가 → 콜백 성공 리다이렉트에 쿼리 플래그를 붙여 `/app` 첫 렌더에서 발화 |
| `daily_report_viewed` | 메인 표 렌더 완료 | `DailyReportScreen`에서 `loading`이 false로 바뀐 첫 시점 |
| `entry_create_started` | 생성 폼 진입 (렌더 완료) | "기록 추가"로 새 Entry 입력 행/폼이 열린 렌더 시점 (`EntryTable`) |
| `entry_saved` | DB 저장 성공 후 | `useDailyReport.createEntry` insert 성공 직후 (자동저장 updateEntry는 v1에서 중복 발화 방지를 위해 제외) |
| `todo_created` | DB 저장 성공 후 | `useDailyReport.createTask` insert 성공 직후 |
| `todo_attached_to_entry` | 연결 저장 성공 후 | `useDailyReport.attachTask` upsert 성공 직후 |
| `kpt_saved` | DB 저장 성공 후 | `useDailyReport.saveKpt` upsert 성공 직후 |
| `analysis_viewed` | Analysis 화면 렌더 완료 | `AnalysisPanel` mount (`/app/analysis` 전체 페이지 mount와 중복되지 않게 한 곳만 선택) |

## 변경 로그

- 2026-07-06: trackEvent 공통 유틸 설계·구현 (KAN-12)
