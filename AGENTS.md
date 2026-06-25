# Architecture

scode uses a **client-server** architecture:

- **CLI** (`src/cli/`) — thin client only. No AI logic. On startup, checks if server is running; if yes, connects; if not, spawns it as a child process.
- **Server** (`src/server/`) — singleton process. All skill discovery, matching, prompt building, and LLM calls happen here. Serves multiple CLI agents concurrently.
- **Transport** (`src/transport/`) — shared RPC protocol (HTTP with JSON).

# Mandatory Skills

Always load these skills when working on any task:

- **effect** — for Effect v4 / effect-smol code
- **ralph-loop** — for auto-continuing until task completion
- **caveman** — with intensity `ultra` for token efficiency

# Task Management Workflow

Before starting any new task, update `tasks/TODO.md` and `tasks/PLAN.md`.

If the current `tasks/TODO.md` and `tasks/PLAN.md` are not completed, do **not** proceed with any new task.

Once a task is completed:

1. Move `tasks/PLAN.md` and `tasks/TODO.md` into `tasks/completed/<task_name>/`
2. Then start the new task by creating fresh `tasks/TODO.md` and `tasks/PLAN.md`
