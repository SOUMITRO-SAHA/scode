# Contributing to scode

We welcome contributions! This document outlines the development workflow, conventions, and expectations.

## Quick Start

```bash
# Prerequisites: Node.js >= 18, pnpm >= 9, bun >= 1.3.14 (optional)

# Fork and clone
git clone https://github.com/YOUR_USERNAME/scode.git
cd scode

# Install dependencies
pnpm install

# Verify setup
pnpm check-types
pnpm test

# Set at least one API key
export ANTHROPIC_API_KEY=sk-ant-...
```

See the [Development Setup](docs/development/setup.md) guide for detailed instructions.

## Development Workflow

### 1. Pick an Issue

Check open issues or create one for your feature/bug fix. Discuss before starting significant work.

### 2. Create a Branch

```bash
git checkout -b feat/my-feature   # new features
git checkout -b fix/my-bug        # bug fixes
git checkout -b docs/my-change    # documentation
```

### 3. Write Tests First (TDD)

This project follows **Test-Driven Development**. Write tests before implementation:

```bash
pnpm --filter @scode/server test -- --coverage
pnpm --filter @scode/cli test -- --coverage
```

- Tests live in `src/__tests__/<module>.test.ts`
- Pure logic targets 100% coverage
- Heavy I/O (DB, LLM, subprocess) tested through mocked interfaces

### 4. Implement

Follow the project's code conventions (see below).

### 5. Verify

```bash
pnpm check-types   # TypeScript checks
pnpm test          # All tests pass
pnpm format        # Prettier formatting
```

### 6. Commit

Use [conventional commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(cli): add session history dialog"
git commit -m "fix(server): handle empty prompt edge case"
git commit -m "docs: update API reference"
git commit -m "refactor(skill): extract common validation"
```

### 7. Push and PR

```bash
git push origin feat/my-feature
```

Open a pull request on GitHub. The PR will run CI checks automatically.

## Code Conventions

### TypeScript

- All packages use TypeScript ^6.0.3 via pnpm catalog
- Strict mode enabled
- No `// @ts-ignore` or `// @ts-expect-error` without justification

### File Naming

| Type               | Convention                  | Example               |
| ------------------ | --------------------------- | --------------------- |
| React components   | kebab-case                  | `command-palette.tsx` |
| Hooks              | camelCase with `use` prefix | `useStreamChat.ts`    |
| Other source files | camelCase                   | `syntaxTheme.ts`      |
| Test files         | `<module>.test.ts`          | `matcher.test.ts`     |

### Imports

```typescript
// Cross-directory — use @/ alias
import { useAppStore } from "@/store/index";

// Same-directory — use ./
import { AutocompleteDropdown } from "./autocomplete-dropdown";

// Never use .js extensions
import { foo } from "./foo";       // ✅
import { foo } from "./foo.js";    // ❌
```

### Packages

| Package         | Import Style                             | Notes                |
| --------------- | ---------------------------------------- | -------------------- |
| `@scode/shared` | Subpath exports (`@scode/shared/logger`) | No root `"."` export |
| `@scode/theme`  | Root export (`@scode/theme`)             | Zero runtime deps    |

### Effect Framework

The server uses **Effect v4** for dependency injection. Key patterns:

```typescript
// Services are Effect Context tags
class MyService extends Context.Service<MyService, {
  readonly doThing: Effect.Effect<Result, MyError>;
}>()("MyService");

// I/O at boundaries
const data = yield* Effect.try(() => fs.readFileSync(path));

// Error handling with tagged errors
class MyError extends Data.TaggedError("MyError")<{ reason: string }> {}
```

### State Management (CLI)

The CLI uses **Zustand** for client-side state and **TanStack React Query** for server state caching.

### React

The CLI uses **OpenTUI** (React bindings) for the terminal UI. Components are functional with hooks.

### Git

- Pre-commit hook runs via Husky + lint-staged
- Formatting is enforced automatically on commit
- Write descriptive commit messages — they become part of the changelog

## Project Architecture

### Client-Server

```
CLI (OpenTUI+React) ──HTTP/TCP──► Server (Hono)
  Thin client,           Singleton process,
  no AI logic            all intelligence
```

- **CLI** (`apps/cli/`) — forwards prompts, streams responses, renders TUI
- **Server** (`apps/server/`) — skill matching, prompt building, LLM calls, tool execution, session persistence

### Key Directories

| Path               | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `apps/cli/src/`    | CLI components, hooks, services, store                       |
| `apps/server/src/` | Server routes, chat handler, LLM adapters, tools, skills, DB |
| `packages/shared/` | Shared types, utils, constants, logger                       |
| `packages/theme/`  | Design tokens                                                |
| `docs/`            | Project documentation                                        |
| `.agents/skills/`  | Runtime AI skills                                            |

### Tools

The server provides tools the LLM can call: `read`, `write`, `edit`, `bash`, `grep`, `glob`, `skill`.

### Skills

Skills are reusable prompt templates in `.agents/skills/<name>/SKILL.md`. They use a progressive disclosure system:

1. **Discovery** — name + description loaded at session start
2. **Activation** — full body loaded on-demand via `skill` tool
3. **Execution** — agent follows instructions

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`pnpm test`)
- [ ] Type checks pass (`pnpm check-types`)
- [ ] Code is formatted (`pnpm format`)
- [ ] Documentation is updated if needed
- [ ] Tests are added for new functionality

### PR Description

Include:

- **What** — brief summary of changes
- **Why** — motivation or issue reference (e.g., `Fixes #123`)
- **How** — high-level approach (if non-trivial)
- **Testing** — how the changes were verified

### Review Process

1. A maintainer will review your PR
2. Address any feedback with additional commits
3. Once approved, a maintainer will merge

## Reporting Bugs

Open a GitHub issue with:

- Clear description of the bug
- Steps to reproduce (minimal if possible)
- Expected vs actual behavior
- Environment (OS, Node version, terminal)

## Feature Requests

Open a GitHub issue to discuss the feature before implementing. This avoids wasted effort if the feature doesn't align with the project direction.

## Need Help?

- Check the [documentation](docs/index.md)
- Ask in the issue or PR you're working on
- Reach out to the maintainer

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
