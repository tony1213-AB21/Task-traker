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

## 삽입 위치 (KAN-13에서 9종 삽입 완료)

| 이벤트 | 성공 기준 | 삽입 위치 |
| --- | --- | --- |
| `app_opened` | 앱 첫 로드 완료 | 루트 레이아웃의 `AppOpened` 컴포넌트 (전체 페이지 로드당 1회, 모듈 가드) |
| `login_completed` | 인증 성공 후 | `/auth/callback`이 성공 리다이렉트에 `?login=1`을 붙이고, `DailyReportScreen`이 감지해 1회 발화 후 쿼리 제거 |
| `daily_report_viewed` | 메인 표 렌더 완료 | `DailyReportScreen`에서 첫 `loading` 종료 시 1회 |
| `entry_create_started` | 생성 시도 시작 | `useDailyReport.createEntry` 진입 시 (현재 UI는 생성 폼 없이 즉시 저장 — KAN-3 검수 가정 B) |
| `entry_saved` | DB 저장 성공 후 | `useDailyReport.createEntry` insert 성공 직후. 신규 생성만 발화, 자동저장(updateEntry)은 제외 (가정 A). `has_kpt`는 해당 날짜 기준 (가정 C) |
| `todo_created` | DB 저장 성공 후 | `useDailyReport.createTask` insert 성공 직후 |
| `todo_attached_to_entry` | 연결 저장 성공 후 | `useDailyReport.attachTask` upsert 성공 직후 |
| `kpt_saved` | DB 저장 성공 후 | `useDailyReport.saveKpt` — 첫 작성(노트 없음 → 있음) 시에만 발화 (blur마다 저장되므로 중복 방지) |
| `analysis_viewed` | Analysis 렌더 완료 | `AnalysisPanel`(탭 진입당 1회) + `/app/analysis` 페이지(방문당 1회), `entry_count` 포함 |

보류된 속성: `project_type`/`work_type`은 프로젝트·서브타입(자유 텍스트) → 허용 값 매핑 규칙이 확정되지 않아 v1 삽입에서 보내지 않습니다.

## GA4 / Amplitude 활성화

`track()`은 두 도구에 동시 전송하며, 각각 키가 설정된 경우에만 동작합니다.

- **GA4**: `NEXT_PUBLIC_GA_MEASUREMENT_ID` 설정 시 루트 레이아웃이 gtag를 로드 (`send_page_view: false`, 스펙의 9개 이벤트만 전송)
- **Amplitude**: `NEXT_PUBLIC_AMPLITUDE_API_KEY` 설정 시 첫 `track()` 호출에서 SDK(`@amplitude/analytics-browser`)를 lazy 로드 (`defaultTracking: false` — 자동 수집 없음)

둘 다 미설정이면 아무것도 전송하지 않으며 개발 환경에서는 `console.debug`로 payload를 확인할 수 있습니다.

## 변경 로그

- 2026-07-06: trackEvent 공통 유틸 설계·구현 (KAN-12)
- 2026-07-06: 9개 이벤트 삽입, GA4 로더 추가 (KAN-13)
- 2026-07-06: Amplitude 전송 추가 — GA4와 이중 전송 (KAN-13)
