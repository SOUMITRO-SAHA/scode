---
name: documentation
description: Generate or update project documentation — README, CONTRIBUTING, API docs, and project guides. Use when the user asks for docs, README, contributing guide, API documentation, setup instructions, or wants to document the project.
compatibility: Designed for scode server — runtime skill loaded by the scode agent.
metadata:
  author: scode
  version: "1.0"
---

When the user asks for documentation, help create or update it.

## Doc types

| Type                | Purpose                                   |
| ------------------- | ----------------------------------------- |
| **README.md**       | Project overview, setup, usage            |
| **CONTRIBUTING.md** | How to contribute, code style, PR process |
| **API docs**        | Function/method documentation             |

## Best practices

- READMEs should explain **what** (the project does), **why** (it exists), and **how** (to use it)
- Include setup steps, example usage, and configuration
- Keep docs close to the code they describe
- Use markdown, keep it readable
- Prefer short sections with clear headings over long walls of text

## Gotchas

- If the user asks for specific doc content without a location, output directly. If they say "write it to the project", write to the appropriate file
- Don't overwrite existing docs without confirming with the user first
- Check if a `docs/` directory exists before suggesting to create one
- For API docs, inspect the actual source code first — don't guess function signatures or behavior
- If the project has a `CONTRIBUTING.md`, reference its conventions when generating new docs
