# Claude Code `/goal` 프롬프트

아래 프롬프트를 Claude Code의 `/goal`에 그대로 넣어 Daily Report MVP 개발을 시작합니다.

```text
Daily Report MVP를 이 저장소에서 끝까지 구현하라.

작업 시작 전 반드시 아래 문서를 순서대로 읽어라.

1. AGENTS.md
2. CLAUDE.md
3. goal/README.md
4. goal/DAILY_REPORT_BUILD_GOAL.md
5. goal/Daily Report.html
6. docs/adr/의 기존 Accepted ADR

구조 판단이 필요하면 .claude/docs/architecture.md를 읽어라.
문서 갱신 판단이 필요하면 .claude/rules/docs-sync.md를 읽어라.
ADR 필요 여부가 애매하면 .claude/rules/adr.md를 읽어라.

Daily Report.html은 Claude Design 원본이다.
이 파일을 그대로 서비스하거나 정적 목업으로 끝내지 마라.
구현 전에 HTML 내부에서 레이아웃, 간격, 색상, Daily Report 표 구조, 오른쪽 패널 탭, Detail/KPT+/To-do/Analysis/Projects 패널, chip/status/row density/column resize 기준을 확인하라.
디자인은 최대한 맞추되, goal/DAILY_REPORT_BUILD_GOAL.md의 기능 요구사항과 충돌하면 goal 문서를 우선하라.

goal/DAILY_REPORT_BUILD_GOAL.md를 요구사항과 완료 기준의 기준으로 삼아라.
Daily Report는 일반 task app, calendar app, dashboard-first analytics app이 아니다.
Daily Report 표가 메인 화면이고, 오른쪽 패널이 선택한 Entry를 편집하고 해석하는 구조여야 한다.
KPT+는 하루 요약이 아니라 선택한 Entry에 붙어야 한다.

현재 코드 구조를 먼저 조사하고 유지하라.
이미 앱 소스가 있으면 기존 프레임워크, 폴더 구조, 스타일을 존중하고 필요한 부분만 바꿔라.
앱 소스가 없다면 목표 문서의 추천 스택과 .claude/docs/architecture.md의 기능 경계 원칙을 따라 최소 구조로 초기화하라.
불필요한 추상화, 과한 설정, v1 범위 밖 기능을 추가하지 마라.

문서와 코드가 충돌하면 다음 순서로 판단하라.

1. 사용자의 최신 명시 지시
2. 실제 코드, DB 스키마, 공개 인터페이스의 현재 동작
3. goal/DAILY_REPORT_BUILD_GOAL.md
4. goal/Daily Report.html
5. AGENTS.md, CLAUDE.md, .claude/rules/
6. .claude/docs/architecture.md
7. docs/adr/의 Accepted ADR

목표 문서와 실제 코드가 다르면 조용히 덮어쓰지 말고 현재 코드를 이해한 뒤 목표를 만족하도록 점진적으로 맞춰라.
구현상 보류하거나 단순화한 항목은 숨기지 말고 알려진 제한으로 문서화하라.

필수 구현 범위는 goal/DAILY_REPORT_BUILD_GOAL.md의 MVP scope와 Acceptance criteria 전체다.
특히 Supabase Auth/RLS, Entry CRUD, Daily Report 표, 오른쪽 Detail 패널, Project/To-do 연결, Entry 단위 KPT+, Links, Analysis, 컬럼 리사이즈/저장, 겹침 경고, 로딩/빈/오류 상태를 빠뜨리지 마라.

완료 전 검증:

- TypeScript build를 실행하고 통과시켜라.
- lint/typecheck 스크립트가 있으면 실행하라.
- Supabase schema 또는 migration 위치를 확인하라.
- .env.example이 있고 실제 비밀값이 커밋되지 않았는지 확인하라.
- 로그인 보호, RLS, user_id scoping, Entry CRUD, duration HH:MM, KPT+ Entry 귀속, To-do 연결, Link Detail 편집, Analysis gap rule을 수동 또는 자동으로 확인하라.
- UI가 데스크톱/노트북 폭에서 Daily Report 표 중심으로 사용 가능한지 확인하라.
- Claude Design HTML과 큰 UI 차이가 있으면 이유를 기록하라.
- goal/DAILY_REPORT_BUILD_GOAL.md의 Acceptance criteria를 항목별로 점검하라.

개발 후 문서 업데이트:

- 실행/설정 방법과 환경변수는 README에 기록하라.
- 새 기능 폴더나 구조가 생기면 docs/에 병렬 기능 README를 필요한 만큼만 작성하라.
- DB schema/migration 실행 방법을 문서화하라.
- 중요한 기술/구조/인증/RLS/문서 체계 결정은 ADR 필요 여부를 검토하고 필요하면 docs/adr/에 남겨라.
- goal 문서 자체는 사용자 요구가 바뀐 경우에만 수정하라. 구현상 보류는 목표 문서를 고쳐 숨기지 말고 알려진 제한으로 남겨라.
- /goal 실행 기준이나 문서 읽기 순서가 바뀌면 goal/CLAUDE_CODE_GOAL_PROMPT.md도 갱신하라.

완료 기준을 모두 만족하기 전에는 끝났다고 말하지 마라.
미완료 항목이 있으면 최종 답변에서 명확히 밝히고, 다음에 무엇을 해야 하는지 적어라.
```
