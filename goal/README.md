# Daily Report 개발 목표 인덱스

이 폴더는 현재 제품 개발 목표와 Claude Design 원본을 보관하는 실행 컨텍스트입니다.  
앱 기능 요구사항의 기준 문서는 `goal/DAILY_REPORT_BUILD_GOAL.md`이고, 시각/상호작용 기준 원본은 `goal/Daily Report.html`입니다.

이 문서는 이후 Claude Code `/goal`, Claude Design, Codex가 같은 문맥을 공유하도록 읽기 순서와 충돌 판단 기준을 정리합니다.

---

## 작업 전 읽을 문서

항상 읽을 문서:

1. `AGENTS.md`: 모든 AI 에이전트가 따르는 공통 개발 원칙
2. `CLAUDE.md`: Claude Code 전용 로드 방식과 `/goal` 안내
3. `goal/README.md`: 현재 개발 컨텍스트, 문서 우선순위, 디자인/목표 문서 역할
4. `goal/DAILY_REPORT_BUILD_GOAL.md`: Daily Report MVP 요구사항, 범위, 완료 기준
5. `goal/Daily Report.html`: Claude Design에서 온 디자인/상호작용 기준 원본

조건부로 읽을 문서:

- `.claude/docs/architecture.md`: 새 폴더를 만들거나 기능 경계/모듈 구조를 결정할 때
- `.claude/rules/docs-sync.md`: `src/`, `docs/`, `goal/` 문서를 수정하거나 개발 후 문서 동기화가 필요할 때
- `.claude/rules/adr.md`: 되돌리기 어려운 구조/기술/문서 체계 결정을 남길지 판단할 때
- `docs/adr/`: 기존 의사결정 기록이 현재 작업과 충돌하거나 영향을 줄 때
- `docs/templates/`: 기능 README 또는 ADR을 새로 만들 때

작업과 직접 관련 없는 오래된 문서, ADR, 규칙 파일은 읽지 않습니다.

---

## 문서 우선순위

충돌이 생기면 아래 순서로 판단합니다.

1. 사용자의 최신 명시 지시
2. 실제 코드, 데이터베이스 스키마, 공개 인터페이스의 현재 동작
3. `goal/DAILY_REPORT_BUILD_GOAL.md`
4. `goal/Daily Report.html`
5. `AGENTS.md`, `CLAUDE.md`, `.claude/rules/`
6. `.claude/docs/architecture.md`
7. `docs/adr/`의 Accepted ADR
8. `docs/`의 기능 README와 템플릿
9. archive 또는 deprecated 표시가 있는 참고 문서

해석 기준:

- 현재 코드가 존재하면 조용히 갈아엎지 말고 먼저 구조를 파악합니다.
- 목표 문서와 실제 코드가 다르면, 목표 문서는 "앞으로 만족해야 할 요구사항"이고 코드는 "현재 상태의 사실"입니다.
- `DAILY_REPORT_BUILD_GOAL.md`와 Claude Design HTML이 충돌하면 목표 문서를 우선합니다.
- Claude Design HTML은 디자인 기준이지 최종 구현물이 아닙니다.
- ADR은 이미 확정된 장기 판단이므로, 변경하려면 새 ADR이나 명시적 기록을 남깁니다.

---

## 현재 제품 목표 요약

Daily Report는 실제 시간 사용을 기록하고 프로젝트, To-do, 링크, KPT+ 회고, 간단한 분석을 연결하는 데스크톱 우선 개인 운영 로그입니다.

핵심 방향:

- Daily Report 표가 첫 화면이자 중심 화면입니다.
- 오른쪽 패널은 선택한 Entry를 편집하고 해석하는 컨텍스트 패널입니다.
- Entry는 실제 시간 기록이며, KPT+는 하루 요약이 아니라 선택한 Entry에 붙습니다.
- Project는 조직/회사 메타데이터를 포함하며, Entry 행에 별도 Company 열을 만들지 않습니다.
- To-do는 Entry에 명시적으로 연결합니다. MVP에서 드래그 앤 드롭은 필수가 아닙니다.
- Light mode, 데스크톱/노트북 우선, 따뜻한 종이색 캔버스와 촘촘한 표 밀도를 유지합니다.

---

## 개발 원칙 위치

- 공통 개발 원칙은 `AGENTS.md`를 따릅니다.
- Claude Code 전용 로드 방식은 `CLAUDE.md`를 따릅니다.
- 폴더 구조와 기능 경계 판단은 `.claude/docs/architecture.md`를 따릅니다.
- 기능 문서 동기화는 `.claude/rules/docs-sync.md`를 따릅니다.
- 큰 설계 결정 기록은 `.claude/rules/adr.md`와 `docs/templates/adr.md`를 따릅니다.

---

## 이번 개발 목표 요약

`goal/DAILY_REPORT_BUILD_GOAL.md`의 목표는 Supabase Auth/RLS를 포함한 실제 동작하는 Daily Report MVP를 만드는 것입니다.

우선순위:

1. Supabase 이메일 인증과 RLS
2. `/app` 보호 라우트와 Daily Report 메인 표
3. Entry CRUD, 시간/기간 계산, 겹침 경고
4. 오른쪽 Detail 패널
5. Project, To-do, Entry 연결
6. Entry 단위 KPT+
7. Link, Tags, Status
8. Analysis 패널과 전체 분석/프로젝트 placeholder 또는 단순 페이지
9. 컬럼 리사이즈, auto-fit, 폭 저장
10. 로딩/빈 상태/오류 상태, 로컬 개발 seed, 문서화

하지 말아야 할 것:

- 정적 HTML만 서빙하기
- 기능 없는 목업으로 끝내기
- 일반적인 task app, calendar app, dashboard-first app으로 바꾸기
- v1 범위를 벗어나는 모바일 재설계, 다크 모드, AI 요약, 월간 분석, 협업, 결제, 네이티브 앱

---

## Claude Design HTML의 위치와 역할

최종 위치: `goal/Daily Report.html`

이 파일은 Claude Design에서 export된 번들 HTML로 보입니다. 내부에는 다음 화면/기준이 들어 있습니다.

- 이메일 magic link/OTP 로그인 화면
- 상단 날짜 내비게이션, 검색, 저장 상태, 기록 추가 버튼
- Daily Report 표, 날짜 섹션, 이전/다음 날 preview, 빈 상태
- 오른쪽 rail 탭: Detail, KPT+, To-do, Analysis, Projects
- Detail 패널의 Entry 맥락, Type/Subtype/Project/Content/Related To-do/Links/Status/Tags
- Entry 단위 KPT+ 패널
- Today/Backlog To-do 패널
- compact Analysis 패널과 Project 카드 패널
- Design System Reference: 색상, pill, status chip, row density, column resize, link 표시 방식

개발에서 사용하는 방법:

- 구현 전에 반드시 열거나 추출해서 레이아웃, 간격, 색상, 표 구조, 오른쪽 패널 구조, chip 스타일을 확인합니다.
- 이 파일을 그대로 서비스하거나 source로 복사해 목업으로 끝내지 않습니다.
- 구현이 디자인 원본과 달라져야 하면 이유를 관련 기능 문서 또는 이 문서의 "사람 확인 필요" 항목에 남깁니다.
- 원본성 보존을 위해 HTML 파일 자체는 사용자가 새 디자인 export를 주지 않는 한 수정하지 않습니다.

---

## GPT 개발 목표 문서의 위치와 역할

최종 위치: `goal/DAILY_REPORT_BUILD_GOAL.md`

역할:

- Daily Report MVP의 제품 요구사항, 기술 스택, 데이터 모델, RLS, 라우트, UI/UX, 완료 기준의 기준 문서입니다.
- Claude Design HTML보다 요구사항 우선순위가 높습니다.
- 개발 중 요구사항을 임의로 축소하지 않습니다.
- 구현상 불가하거나 보류한 항목은 "완료"로 숨기지 말고 알려진 제한으로 문서화합니다.

`/goal`에서 참고하는 방법:

- 이 문서를 요구사항 체크리스트로 사용합니다.
- "Acceptance criteria"를 완료 전 검증 목록으로 사용합니다.
- 너무 큰 기능은 가장 단순한 동작 버전으로 먼저 구현하되, 해당 항목이 요구한 사용자 가치가 충족되는지 확인합니다.

---

## 완료 판단 방법

완료라고 말하려면 최소한 다음을 만족해야 합니다.

- `goal/DAILY_REPORT_BUILD_GOAL.md`의 Acceptance criteria를 항목별로 점검했습니다.
- TypeScript build가 통과합니다.
- lint 또는 typecheck가 있으면 실행했고, 남은 경고는 문서화했습니다.
- Supabase schema/migration 또는 `supabase/schema.sql` 위치가 명확합니다.
- `.env.example`이 있고, 실제 비밀값은 커밋하지 않았습니다.
- 로컬 실행 방법과 필요한 환경변수가 README에 있습니다.
- 구현이 Claude Design HTML과 의도적으로 다르면 차이와 이유가 기록되어 있습니다.
- 미완료 항목을 숨기지 않고 알려진 제한으로 남겼습니다.

완료 기준을 모두 만족하기 전에는 "끝났다"고 말하지 않습니다.

---

## 개발 후 문서 동기화 규칙

코드 변경 후:

- 앱 구조를 새로 만들거나 큰 기능 폴더를 추가하면 가장 가까운 `docs/` 경로에 기능 README를 만듭니다.
- 루트 실행/설정 방법이 생기면 프로젝트 README를 만들거나 갱신합니다.
- 데이터베이스 구조나 Supabase 설정이 바뀌면 schema/migration 위치와 실행 방법을 문서화합니다.
- 중요한 의존성, 인증/RLS, 데이터 모델, 큰 폴더 구조 결정은 ADR 필요 여부를 검토합니다.

UI/UX 변경 후:

- Claude Design HTML은 원본으로 유지합니다.
- 의미 있는 UI 구조, 패널 구성, 컬럼 정책, 디자인 토큰이 바뀌면 관련 기능 README에 기록합니다.
- 원본과 다른 구현을 선택했다면 "왜 달라졌는지"와 "어떤 사용자 가치 때문에 선택했는지"를 남깁니다.

goal 문서와 실제 구현이 달라졌을 때:

- 사용자 요구 자체가 바뀐 경우에만 `goal/DAILY_REPORT_BUILD_GOAL.md`를 갱신합니다.
- 구현상 보류나 축소는 목표 문서를 고쳐서 숨기지 말고, README의 알려진 제한 또는 기능 문서에 기록합니다.
- Acceptance criteria에 영향을 주는 보류는 최종 보고에 반드시 포함합니다.

Claude Design 원본과 실제 구현이 달라졌을 때:

- 디자인 원본은 수정하지 않습니다.
- 구현 차이를 관련 기능 README 또는 개발 보고에 기록합니다.
- 장기 디자인 방향을 바꾸는 결정이면 ADR 필요 여부를 검토합니다.

`/goal` 프롬프트가 달라져야 할 때:

- 작업 전 읽을 문서, 충돌 판단, 검증, 문서 동기화 기준이 바뀌면 `goal/CLAUDE_CODE_GOAL_PROMPT.md`도 갱신합니다.

---

## 중요한 결정 기록 방식

- 장기 유지보수, 기술 스택, 데이터 모델, 인증/RLS, 배포 단위, 문서 체계 우선순위처럼 되돌리기 어려운 판단은 `docs/adr/`에 ADR로 기록합니다.
- 기능의 현재 역할과 흐름은 `docs/`의 기능 README에 기록합니다.
- 현재 개발 목표와 디자인 원본의 관계는 이 문서에 기록합니다.
- 단기 구현 메모나 미완료 항목은 관련 README의 알려진 제한 또는 최종 개발 보고에 기록합니다.

이번 정리 결정은 `docs/adr/0001-development-preparation-document-system.md`에 기록했습니다.

---

## 정리 결정

- 기존 `AGENTS.md`/`CLAUDE.md` 분리는 유지했습니다. 공통 원칙과 Claude Code 전용 로드 방식을 나누는 현재 구조가 합리적이기 때문입니다.
- `.claude/`는 AI 작업 규칙, `docs/`는 기능 문서/ADR/템플릿, `goal/`은 현재 제품 목표와 디자인 원본으로 유지했습니다. 역할이 다르므로 강제 통합하지 않았습니다.
- Claude Design HTML은 `goal/Daily Report.html`에 그대로 두었습니다. 현재 위치가 개발 목표 문서와 가깝고, 원본을 이동해 링크 혼란을 만드는 이득이 작기 때문입니다.
- `goal/README.md`를 새로 만들었습니다. 여러 AI 에이전트가 먼저 읽을 단일 인덱스가 없었기 때문입니다.
- `goal/CLAUDE_CODE_GOAL_PROMPT.md`를 새로 만들었습니다. Claude Code `/goal`에 바로 넣을 실행 프롬프트가 필요하기 때문입니다.
- ADR을 추가했습니다. 문서 우선순위와 원본 보존 방식은 이후 개발 흐름에 반복적으로 영향을 주는 결정이기 때문입니다.

---

## 사람 확인 필요

- 현재 저장소에는 앱 소스, `package.json`, Supabase 설정이 없습니다. 다음 개발 단계에서 프로젝트 초기화가 필요합니다.
- Supabase 프로젝트 URL/anon key 등 환경변수 값은 제공되지 않았습니다. 실제 비밀값은 문서에 쓰지 말고 `.env.local`에만 둬야 합니다.
- Claude Design HTML에는 개인 이메일처럼 보이는 데모 값이 포함되어 있습니다. 실제 구현 seed나 placeholder에 그대로 복사하지 마세요.
- Claude Design HTML의 표시 날짜는 `2026. 7. 3. (목)`이지만, 2026-07-03은 금요일입니다. 구현에서는 날짜 라이브러리로 실제 요일을 계산하세요.
- Continuous day scroll은 목표 문서에서 preferred UX이지만 MVP fallback을 허용합니다. 먼저 날짜 내비게이션과 sticky day divider를 구현하세요.

---

## Claude Code `/goal` 프롬프트

최종 프롬프트 위치: `goal/CLAUDE_CODE_GOAL_PROMPT.md`

Claude Code에서 Daily Report MVP 개발을 시작할 때 해당 파일의 프롬프트를 `/goal`에 넣습니다.

---

## 변경 로그

- 2026-07-03: 개발 준비 문서 체계, 문서 우선순위, 디자인 원본 역할, `/goal` 프롬프트 위치를 정리했습니다.
