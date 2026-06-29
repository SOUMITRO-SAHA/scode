# Built-in Skills

scode ships with the following built-in skills located in `.agents/skills/`.

## welcome-me

Greets new users and explains scode's architecture.

**Triggers**: User says they're new, asks "what can you do?", "how does this work?", "get started"

**Provides**:

- Project overview
- Architecture explanation (client-server)
- Suggested starter prompts

## changelog

Generates or updates `CHANGELOG.md` from git history.

**Triggers**: User asks for changelog, release notes, version log, "what changed"

**Workflow**:

1. Analyze git log
2. Categorize changes (feat, fix, refactor, docs, etc.)
3. Generate formatted changelog
4. Write to `CHANGELOG.md`

**Requires**: Git repository with commit history

## documentation

Generates or updates project documentation.

**Triggers**: User asks for docs, README, contributing guide, setup instructions, API docs

**Covers**:
| Doc Type | Typical File |
|----------|-------------|
| Overview | `README.md` |
| Setup | `docs/setup.md` |
| API | `docs/api.md` |
| Contributing | `CONTRIBUTING.md` |
| Architecture | `docs/architecture.md` |
