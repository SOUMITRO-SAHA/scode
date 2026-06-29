#!/usr/bin/env bash
set -euo pipefail

SCOPE="apps/cli"
ENTRY="$SCOPE/src/index.tsx"

for arg in "$@"; do
  if [ "$arg" = "--prompt" ]; then
    exec pnpm exec tsx --tsconfig "$SCOPE/tsconfig.json" "$ENTRY" "$@"
  fi
done

bun "$ENTRY" "$@" 2>/dev/null || exec pnpm exec tsx --tsconfig "$SCOPE/tsconfig.json" "$ENTRY" "$@"
