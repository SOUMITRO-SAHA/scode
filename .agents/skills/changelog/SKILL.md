---
name: changelog
description: Generate or update a CHANGELOG.md file based on git history
---

# changelog

When the user wants a changelog, generate a markdown changelog.

Structure:

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

Use `git log --oneline --decorate --tags` to see recent history. Group commits by tag/version if tags exist. If no tags, group by logical sections.

Output directly to the user (don't write to file unless asked).
