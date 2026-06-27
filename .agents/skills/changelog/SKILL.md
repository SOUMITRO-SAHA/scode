---
name: changelog
description: Generate or update a CHANGELOG.md file from git history. Use when the user asks for a changelog, release notes, version log, git history summary, "what changed", or wants to track project changes over time.
compatibility: Designed for scode server — runtime skill loaded by the scode agent. Requires git repository.
metadata:
  author: scode
  version: "1.0"
---

When the user wants a changelog, generate one using git history.

## Workflow

1. Run `git log --oneline --decorate --tags` to see recent history
2. Group commits by tag/version if tags exist
3. If no tags, group by logical sections (Added, Changed, Fixed, Removed)

## Output template

```markdown
# Changelog

## [Unreleased]

### Added

- New features

### Changed

- Changes to existing functionality

### Fixed

- Bug fixes

### Removed

- Removed features
```

## Gotchas

- Output directly to the user. Don't write to a file unless explicitly asked
- If the repo has no commits, inform the user rather than generating an empty changelog
- Use `git log --oneline --decorate --tags --all` if the user wants to see all branches
- For semantic versioning (semver), check if tags follow a `v*` pattern (e.g., v1.0.0) and preserve that convention
- If the repo is large, limit to the last N commits (e.g., `-50`) to avoid overwhelming output — ask the user if they need more
