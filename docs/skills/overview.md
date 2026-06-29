# Skills

Skills are reusable prompt templates that give the AI specialized knowledge and instructions for specific tasks.

## How Skills Work

```
.agents/skills/<skill-name>/
  └── SKILL.md        # YAML frontmatter + Markdown body
```

### SKILL.md Format

```yaml
---
name: my-skill
description: What this skill does
---
# Skill Body

Instructions for the AI when this skill is active...

You can use **Markdown** formatting here.
```

### Frontmatter Fields

| Field         | Required | Description                           |
| ------------- | -------- | ------------------------------------- |
| `name`        | Yes      | Unique skill identifier               |
| `description` | Yes      | Brief description for matching        |
| `tags`        | No       | Comma-separated keywords for matching |

## Skill Matching

Skills are matched to user prompts using **keyword-based matching**:

1. Tokenize the prompt and skill metadata
2. Remove stop words ("the", "is", "at", etc.)
3. Count exact and fuzzy keyword overlaps
4. Return matched skills sorted by relevance

The `main` fallback skill is always included if no skills match.

### Example Matching

```
User prompt: "Generate changelog from git history"
Matched skills:
  - changelog (high relevance: "changelog", "git history")
  - main (fallback, always included)
```

## Skill Discovery Directories

The server scans these directories (in both project CWD and user home `~/.scode/`):

| Directory           | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `.agents/skills/`   | Runtime skills for scode AI agent                       |
| `.opencode/skills/` | Dev skills for building scode (never loaded at runtime) |
| `.claude/skills/`   | Claude project skills                                   |
| `.cursor/skills/`   | Cursor editor skills                                    |
| `.gemini/skills/`   | Gemini skills                                           |
| `.codex/skills/`    | Codex skills                                            |

## Dynamic Skill Loading

The LLM can load skills mid-conversation using the `skill` tool:

```
User: "I need to generate a changelog"
AI: [calls skill tool with name="changelog"]
AI: [continues with changelog instructions loaded]
```

## Related

- [Creating Custom Skills](creating-skills.md) — build your own skills
- [Built-in Skills](built-in-skills.md) — skills that ship with scode
- [Implementation Details](implementation.md) — deep dive into the skill system architecture

```

```
