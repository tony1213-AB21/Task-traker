# 개발 준비 문서 체계 유지

## 상태

Accepted

## 맥락

현재 저장소는 앱 소스보다 개발 준비 문서가 중심입니다.  
`AGENTS.md`, `CLAUDE.md`, `.claude/`, `docs/`, `goal/`이 서로 다른 역할을 갖고 있지만, 이후 Claude Code `/goal`, Claude Design, Codex가 어떤 문서를 우선 읽어야 하는지 한곳에 정리되어 있지 않았습니다.

Claude Design HTML과 GPT가 만든 개발 목표 문서도 같은 `goal/` 폴더에 있었지만, 원본 디자인 기준인지 실행 요구사항인지 역할 구분을 명확히 해야 했습니다.

## 결정

- `AGENTS.md`는 모든 AI 에이전트의 공통 개발 원칙으로 유지합니다.
- `CLAUDE.md`는 `AGENTS.md`를 가져오고 Claude Code 전용 로드/`/goal` 안내만 둡니다.
- `.claude/`는 AI 작업 규칙과 아키텍처 판단 기준으로 유지합니다.
- `docs/`는 기능 문서, ADR, 문서 템플릿의 공식 위치로 유지합니다.
- `goal/`은 현재 제품 목표, Claude Design 원본, Claude Code `/goal` 프롬프트의 위치로 유지합니다.
- `goal/Daily Report.html`은 이동하지 않고 Claude Design 원본으로 보존합니다.
- `goal/DAILY_REPORT_BUILD_GOAL.md`는 Daily Report MVP 요구사항과 완료 기준의 기준 문서로 유지합니다.
- `goal/README.md`를 개발 목표 인덱스로 추가해 작업 전 읽을 문서, 문서 우선순위, 디자인/목표 문서 역할, 동기화 규칙을 정리합니다.
- `goal/CLAUDE_CODE_GOAL_PROMPT.md`를 Claude Code `/goal`에 바로 넣을 실행 프롬프트로 추가합니다.

## 결과

장점:

- 기존 구조를 크게 바꾸지 않고도 AI 에이전트의 읽기 순서와 충돌 판단 기준이 명확해집니다.
- Claude Design HTML을 원본으로 보존하면서 실제 구현 요구사항과의 관계가 분리됩니다.
- `/goal` 실행 프롬프트가 저장소에 남아 반복 실행과 수정이 쉬워집니다.

단점:

- `goal/README.md`와 `goal/DAILY_REPORT_BUILD_GOAL.md`가 함께 유지되어야 합니다.
- 개발 중 요구사항 자체가 바뀌면 `/goal` 프롬프트까지 갱신해야 합니다.

트레이드오프:

- 문서를 하나로 통합하면 단순해지지만, 원칙/규칙/ADR/목표/디자인 원본의 역할이 흐려집니다.
- 현재처럼 역할별 파일을 유지하고 인덱스를 추가하는 방식이 적은 변경으로 가장 큰 효과를 냅니다.
