import { describe, expect, it } from "vitest";

import { preprocessMarkdown } from "../markdown-renderer";

describe("preprocessMarkdown", () => {
  describe("task lists", () => {
    it("converts unchecked task item to checkbox", () => {
      const input = "- [ ] Task item";
      const result = preprocessMarkdown(input);
      expect(result).toBe("☐ Task item");
    });

    it("converts checked task item to checkbox", () => {
      const input = "- [x] Completed task";
      const result = preprocessMarkdown(input);
      expect(result).toBe("☑ Completed task");
    });

    it("handles uppercase X", () => {
      const input = "- [X] Completed task";
      const result = preprocessMarkdown(input);
      expect(result).toBe("☑ Completed task");
    });

    it("preserves indentation", () => {
      const input = "  - [ ] Nested task";
      const result = preprocessMarkdown(input);
      expect(result).toBe("  ☐ Nested task");
    });

    it("handles multiple task items", () => {
      const input = "- [ ] First\n- [x] Second\n- [ ] Third";
      const result = preprocessMarkdown(input);
      expect(result).toBe("☐ First\n☑ Second\n☐ Third");
    });

    it("preserves non-task list items", () => {
      const input = "- Regular item\n- [ ] Task item";
      const result = preprocessMarkdown(input);
      expect(result).toBe("- Regular item\n☐ Task item");
    });
  });

  describe("callouts", () => {
    it("converts NOTE callout", () => {
      const input = "> [!NOTE]\n> This is a note";
      const result = preprocessMarkdown(input);
      expect(result).toContain("ℹ");
      expect(result).toContain("**Note**");
    });

    it("converts TIP callout", () => {
      const input = "> [!TIP]\n> This is a tip";
      const result = preprocessMarkdown(input);
      expect(result).toContain("💡");
      expect(result).toContain("**Tip**");
    });

    it("converts IMPORTANT callout", () => {
      const input = "> [!IMPORTANT]\n> This is important";
      const result = preprocessMarkdown(input);
      expect(result).toContain("❗");
      expect(result).toContain("**Important**");
    });

    it("converts WARNING callout", () => {
      const input = "> [!WARNING]\n> This is a warning";
      const result = preprocessMarkdown(input);
      expect(result).toContain("⚠");
      expect(result).toContain("**Warning**");
    });

    it("converts CAUTION callout", () => {
      const input = "> [!CAUTION]\n> This is caution";
      const result = preprocessMarkdown(input);
      expect(result).toContain("🚨");
      expect(result).toContain("**Caution**");
    });

    it("handles lowercase callout type", () => {
      const input = "> [!note]\n> Lowercase note";
      const result = preprocessMarkdown(input);
      expect(result).toContain("ℹ");
      expect(result).toContain("**Note**");
    });

    it("handles mixed case callout type", () => {
      const input = "> [!NoTe]\n> Mixed case note";
      const result = preprocessMarkdown(input);
      expect(result).toContain("ℹ");
      expect(result).toContain("**Note**");
    });
  });

  describe("code blocks", () => {
    it("adds language badge to TypeScript code block", () => {
      const input = "```typescript\nconst x = 1;\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("// TypeScript");
    });

    it("adds language badge to Python code block with hash comment", () => {
      const input = "```python\nx = 1\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("# Python");
    });

    it("adds language badge to bash code block", () => {
      const input = "```bash\necho hello\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("# Bash");
    });

    it("adds language badge to SQL code block", () => {
      const input = "```sql\nSELECT * FROM users;\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("-- SQL");
    });

    it("handles ts alias", () => {
      const input = "```ts\nconst x = 1;\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("// TypeScript");
    });

    it("handles js alias", () => {
      const input = "```js\nconst x = 1;\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("// JavaScript");
    });

    it("handles unknown languages", () => {
      const input = "```unknownlang\ncode here\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("// UNKNOWNLANG");
    });

    it("preserves code blocks without language", () => {
      const input = "```\ncode here\n```";
      const result = preprocessMarkdown(input);
      expect(result).toBe(input);
    });

    it("preserves code content after badge", () => {
      const input = "```typescript\nconst x = 1;\nconst y = 2;\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("const x = 1;");
      expect(result).toContain("const y = 2;");
    });

    it("handles multiple code blocks", () => {
      const input = "```typescript\ncode1\n```\n\n```python\ncode2\n```";
      const result = preprocessMarkdown(input);
      expect(result).toContain("// TypeScript");
      expect(result).toContain("# Python");
    });
  });

  describe("combined content", () => {
    it("handles task lists and callouts together", () => {
      const input = `# Project Tasks

> [!NOTE]
> Important tasks below

- [ ] First task
- [x] Second task (done)`;
      const result = preprocessMarkdown(input);
      expect(result).toContain("ℹ");
      expect(result).toContain("☐ First task");
      expect(result).toContain("☑ Second task (done)");
    });

    it("preserves regular markdown", () => {
      const input = `# Heading

**Bold** and *italic* text.

\`\`\`ts
const x = 1;
\`\`\``;
      const result = preprocessMarkdown(input);
      expect(result).toContain("# Heading");
      expect(result).toContain("**Bold**");
      expect(result).toContain("*italic*");
      expect(result).toContain("```ts");
      expect(result).toContain("// TypeScript");
    });

    it("preserves tables", () => {
      const input = `| Col1 | Col2 |
|------|------|
| A    | B    |`;
      const result = preprocessMarkdown(input);
      expect(result).toBe(input);
    });

    it("preserves links", () => {
      const input = "[Link text](https://example.com)";
      const result = preprocessMarkdown(input);
      expect(result).toBe(input);
    });

    it("handles empty input", () => {
      expect(preprocessMarkdown("")).toBe("");
    });

    it("handles whitespace-only input", () => {
      const input = "   \n\t\n   ";
      const result = preprocessMarkdown(input);
      expect(result).toBe(input);
    });
  });
});
