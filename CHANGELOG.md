# Changelog

All notable changes to the PeteMart Agentic Framework are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Tool efficiency rules as session instructions (`context_lake/tool_efficiency.md`) (#12)
- Auto-allow for safe commands in permission config (#10)
- Server-side CI on feature branch push (`ci-feature-push.yml`) (#8)
- AI assistant workflow compliance tracking in STATE_MATRIX.json (#8)

### Changed
- Deploy trigger: only on infra file changes or manual dispatch (#9)
- Smoke test: non-fatal for unresolved domain alias (#7)
- Commit message format enforced via commit-msg hook (#3, #4)

### Fixed
- Deploy workflow syntax error (`secrets.*` in job-level `if:`) (#6)

---

## [0.1.0] - 2026-06-04

### Added
- Feature branch workflow enforcement (pre-push hook, PR template) (#3)
- Requirements traceability (TRACEABILITY_MATRIX.json) (#4)
- 103 PRD requirements mapped across 11 categories (#4)
- Pre-commit gate: AI code review, TypeScript check, unit tests (#3)
- CI pipeline: build, lint, typecheck, tests, security scan (#3)
- Code review automation: PR-Agent, SonarQube, Reviewdog, CodeQL (#3)
- Agent 0 compliance checks (SUP-001 to SUP-010) (#3, #4)
