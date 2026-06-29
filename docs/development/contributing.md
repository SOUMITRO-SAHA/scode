# Contributing

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Set up the [development environment](setup.md)
4. Write tests first (TDD)
5. Implement your changes
6. Run tests and type checks
7. Submit a pull request

## Code Conventions

### File Naming

| Type                  | Convention                  | Example               |
| --------------------- | --------------------------- | --------------------- |
| React components      | kebab-case                  | `command-palette.tsx` |
| Hooks                 | camelCase with `use` prefix | `useStreamChat.ts`    |
| Other files           | camelCase                   | `syntaxTheme.ts`      |
| Component directories | kebab-case                  | `ui/`, `chat/`        |

### Imports

```typescript
// Cross-directory — use @/ alias
// Same-directory — use ./
import { AutocompleteDropdown } from "./autocomplete-dropdown";

import { Composer } from "@/components/composer/index";
import { useAppStore } from "@/store/index";

// Avoid deep relative paths like ../../store
```

### TypeScript

- All packages use TypeScript ^6.0.3 (via pnpm catalog)
- Strict mode enabled
- No `// @ts-ignore` or `// @ts-expect-error` without justification

### No .js Extensions

Never use `.js` suffix in imports. tsx resolves extensionless imports natively:

```typescript
// Correct
import { foo } from "./foo"

// Wrong
import { foo } from "./foo.js"
```

## Pull Request Process

1. Ensure all tests pass: `pnpm test`
2. Ensure type checks pass: `pnpm check-types`
3. Run formatter: `pnpm format`
4. Update documentation if needed
5. Create PR with clear description of changes
6. Link related issues

## Commit Messages

Follow conventional commits:

```
feat: add new tool for file search
fix: handle empty prompt edge case
docs: update API reference
refactor: extract common validation logic
test: add tests for skill matcher
chore: update dependencies
```

## Architecture Decisions

Before making significant changes, review:

- [Architecture Overview](../architecture/overview.md)
- [Client-Server Architecture](../architecture/client-server.md)
- [Data Flow](../architecture/data-flow.md)

Key principles:

- CLI is client-only (no AI logic)
- Server is the single source of intelligence
- Skills are the primary extension mechanism
- Effect for dependency injection

## Questions?

Open an issue or discussion on GitHub.
