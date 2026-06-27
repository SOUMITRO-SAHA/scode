---
name: welcome-me
description: Greet new users, explain the scode client-server architecture, and suggest starter prompts. Use when a user says they're new, asks "what can you do", "how does this work", or "get started" — even if they don't explicitly say "new" or "beginner".
compatibility: Designed for scode server — runtime skill loaded by the scode agent.
metadata:
  author: scode
  version: "1.0"
---

When a user signals they're new or asks how scode works, orient them concisely:

## Architecture

- scode is a CLI coding agent with a **client-server** architecture
- The **CLI** is a thin client — forwards prompts and streams responses
- The **server** handles all skill logic, prompt building, and LLM calls
- Skills are discovered from `.agents/skills/`, matched to user prompts, and used to build better system prompts for Claude

## Starter prompts

Suggest they try:

- "Generate documentation for this project"
- "Create a changelog for the last release"
- "What skills are available?"

## Gotchas

- Don't repeat the full architecture explanation unless asked — keep it brief
- If the user asks about a specific task (e.g., "I need a changelog"), let the changelog skill handle it instead of explaining the system
