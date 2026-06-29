# Creating Skills

This guide explains how to create custom skills for scode.

## Step 1: Create the Directory

```bash
mkdir -p .agents/skills/my-custom-skill
```

## Step 2: Write the SKILL.md

```markdown
---
name: my-custom-skill
description: Helps with React component refactoring and best practices
tags: react, components, refactoring, frontend
---

# React Refactoring Skill

When helping with React components, always follow these rules:

1. Prefer functional components with hooks over class components
2. Extract reusable logic into custom hooks
3. Use TypeScript interfaces for props
4. Follow the project's existing patterns

## File Structure

When creating new components, follow:
```

src/components/{feature}/{component-name}.tsx
src/components/{feature}/{component-name}.test.tsx

```

## Checklist

- [ ] Use named exports
- [ ] Add proper TypeScript types
- [ ] Include unit tests
- [ ] Handle loading and error states
```

## Step 3: Test the Skill

```bash
pnpm cli --prompt "Refactor this React component"
```

## Best Practices

### Naming

- Use kebab-case for skill directory names
- Keep names short and descriptive
- Avoid special characters

### Descriptions

- Write clear, keyword-rich descriptions
- Include terms users might naturally use
- Be specific about what the skill does

### Instructions

- Be specific and actionable
- Use Markdown for structure
- Include code examples where helpful
- Reference project-specific patterns

### Tags

- Add relevant keywords for matching
- Include technology names (react, typescript, python, etc.)
- Include task types (refactoring, testing, documentation)

## Where to Place Skills

| Location            | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `.agents/skills/`   | Skills that run with the scode AI agent (runtime)            |
| `.opencode/skills/` | Skills for the AI coding assistant building scode (dev only) |

## Testing Your Skill

```bash
# List discovered skills
curl http://localhost:4100/api/v1/skills

# Get skill details
curl http://localhost:4100/api/v1/skills/my-custom-skill

# Reload skill cache
curl -X POST http://localhost:4100/api/v1/skills/reload

# Validate all skills
curl -X POST http://localhost:4100/api/v1/skills/validate
```
