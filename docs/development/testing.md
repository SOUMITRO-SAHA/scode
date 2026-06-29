# Testing

scode follows **Test-Driven Development (TDD)**. Write tests first, then implement.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @scode/cli test
pnpm --filter @scode/server test
pnpm --filter @scode/shared test
pnpm --filter @scode/theme test

# Run with coverage
pnpm --filter @scode/cli test -- --coverage
pnpm --filter @scode/server test -- --coverage
```

## Test Structure

Tests live in `src/__tests__/` alongside source code:

```
apps/server/src/
├── __tests__/
│   ├── skill/
│   │   ├── discover.test.ts
│   │   ├── matcher.test.ts
│   │   └── loader.test.ts
│   ├── tool/
│   │   ├── bash.test.ts
│   │   ├── edit.test.ts
│   │   ├── glob.test.ts
│   │   ├── grep.test.ts
│   │   ├── read.test.ts
│   │   └── write.test.ts
│   ├── llm/
│   │   └── executor.test.ts
│   └── prompt/
│       └── builder.test.ts
├── tool/
│   ├── read.ts
│   ├── read.test.ts      # <-- alternative placement
│   └── ...
```

## Testing Conventions

- **File naming**: `<module>.test.ts`
- **Framework**: Vitest
- **Coverage**: `@vitest/coverage-v8`
- **Target**: 100% line/function/branch coverage for pure logic
- **Type-only exports**: Excluded from coverage

## Coverage

```bash
# Run with coverage report
pnpm --filter @scode/server test -- --coverage
```

Coverage thresholds are not enforced by config but are a team standard.

## Mocking

- Heavy I/O (database, LLM, subprocess) tested through mocked interfaces
- Effect services can be replaced with mock layers for testing
- No real API calls in tests

## Type Checking

```bash
# Type-check all packages
pnpm check-types

# Type-check specific package
pnpm --filter @scode/server check-types
```

Test files are excluded from `tsconfig` so `check-types` stays clean on implementation files.
