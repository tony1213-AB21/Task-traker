# CLAUDE.md

@AGENTS.md

## Claude Code 전용 지침

Claude Code는 `.claude/rules/`의 path-scoped 규칙을 사용할 수 있습니다.  
이 규칙들은 관련 파일을 읽을 때 컨텍스트에 들어옵니다.

자동 로드 규칙:

- `.claude/rules/docs-sync.md`: `src/` 또는 `docs/` 작업 시 적용
- `.claude/rules/adr.md`: `docs/adr/` 작업 시 적용

수동 참조 규칙:

- `.claude/docs/architecture.md`: 폴더 구조, 기능 경계, 캡슐화, 모듈화 판단 시 직접 확인

각 규칙을 언제 참조해야 하는지는 `AGENTS.md`의 본문 항목을 따르세요.

작업과 직접 관련 없는 README, ADR, 규칙 파일은 읽지 마세요.

## Claude Code `/goal` 준비

Daily Report 제품 개발 `/goal`을 실행할 때는 먼저 `goal/README.md`를 읽고, 최종 프롬프트는 `goal/CLAUDE_CODE_GOAL_PROMPT.md`를 사용하세요.

`goal/Daily Report.html`은 Claude Design 원본이며, `goal/DAILY_REPORT_BUILD_GOAL.md`는 구현 요구사항과 완료 기준의 기준 문서입니다.
