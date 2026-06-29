#!/usr/bin/env bash
set -euo pipefail

SCOPE="apps/cli"
ENTRY="src/index.tsx"

# Capture original cwd before changing directories
export SCODE_ORIGINAL_CWD="$(pwd)"

for arg in "$@"; do
  if [ "$arg" = "--prompt" ]; then
    exec pnpm exec tsx --tsconfig "$SCOPE/tsconfig.json" "$SCOPE/$ENTRY" "$@"
  fi
done

bun run --cwd "$SCOPE" "$ENTRY" "$@" 2>/dev/null || exec pnpm exec tsx --tsconfig "$SCOPE/tsconfig.json" "$SCOPE/$ENTRY" "$@"
