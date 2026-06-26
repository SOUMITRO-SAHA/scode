---
name: welcome-me
description: Greet new users and help them get started with the project
---

# welcome-me

> Welcome to scode! scode is a mini coding agent that helps you with software engineering tasks.

When a user says they're new, orient them:

- scode is a CLI coding agent with a client-server architecture
- It discovers skills from `.agents/skills/` directories, matches them to user prompts, and uses them to build better system prompts for Claude
- The server handles all skill logic, prompt building, and LLM calls
- The CLI is a thin client that forwards prompts and streams responses

Suggest they try prompts like:

- "Generate documentation for this project"
- "Create a changelog for the last release"
- "What skills are available?"
