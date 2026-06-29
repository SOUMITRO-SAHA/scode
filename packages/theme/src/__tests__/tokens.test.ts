import { describe, expect, it } from "vitest";

import {
  background,
  border,
  brand,
  chat,
  input,
  markdown,
  opacity,
  shadows,
  status,
  terminal,
  text,
  theme,
} from "../tokens";

describe("background", () => {
  it("has all layers", () => {
    expect(background.primary).toBeDefined();
    expect(background.secondary).toBeDefined();
    expect(background.surface).toBeDefined();
    expect(background.hover).toBeDefined();
    expect(background.active).toBeDefined();
  });
});

describe("border", () => {
  it("has all variants", () => {
    expect(border.primary).toBeDefined();
    expect(border.secondary).toBeDefined();
    expect(border.focus).toBeDefined();
    expect(border.error).toBeDefined();
  });
});

describe("text", () => {
  it("has all levels", () => {
    expect(text.primary).toBeDefined();
    expect(text.secondary).toBeDefined();
    expect(text.muted).toBeDefined();
    expect(text.disabled).toBeDefined();
    expect(text.inverse).toBeDefined();
  });
});

describe("brand", () => {
  it("has all states", () => {
    expect(brand.primary).toBeDefined();
    expect(brand.hover).toBeDefined();
    expect(brand.active).toBeDefined();
    expect(brand.subtle).toBeDefined();
  });
});

describe("markdown", () => {
  it("has all tokens", () => {
    expect(markdown.heading).toBeDefined();
    expect(markdown.codeBackground).toBeDefined();
    expect(markdown.link).toBeDefined();
  });

  it("has task list tokens", () => {
    expect(markdown.task).toBeDefined();
    expect(markdown.task.checked).toBeDefined();
    expect(markdown.task.unchecked).toBeDefined();
    expect(markdown.task.checkedText).toBeDefined();
  });

  it("has callout tokens", () => {
    expect(markdown.callout).toBeDefined();
    expect(markdown.callout.note).toBeDefined();
    expect(markdown.callout.tip).toBeDefined();
    expect(markdown.callout.important).toBeDefined();
    expect(markdown.callout.warning).toBeDefined();
    expect(markdown.callout.caution).toBeDefined();
  });

  it("has diff tokens", () => {
    expect(markdown.diff).toBeDefined();
    expect(markdown.diff.add).toBeDefined();
    expect(markdown.diff.delete).toBeDefined();
    expect(markdown.diff.context).toBeDefined();
    expect(markdown.diff.header).toBeDefined();
  });
});

describe("chat", () => {
  it("has user and assistant styles", () => {
    expect(chat.user.background).toBeDefined();
    expect(chat.user.border).toBeDefined();
    expect(chat.assistant.text).toBeDefined();
    expect(chat.thinking).toBeDefined();
  });
});

describe("input", () => {
  it("has all states", () => {
    expect(input.background).toBeDefined();
    expect(input.border).toBeDefined();
    expect(input.focus).toBeDefined();
    expect(input.placeholder).toBeDefined();
  });
});

describe("terminal", () => {
  it("has all tokens", () => {
    expect(terminal.prompt).toBeDefined();
    expect(terminal.command).toBeDefined();
    expect(terminal.output).toBeDefined();
    expect(terminal.cursor).toBeDefined();
  });
});

describe("status", () => {
  it("has all statuses", () => {
    expect(status.success).toBeDefined();
    expect(status.warning).toBeDefined();
    expect(status.danger).toBeDefined();
    expect(status.info).toBeDefined();
  });
});

describe("opacity", () => {
  it("has all levels", () => {
    expect(opacity.disabled).toBeLessThan(opacity.muted);
    expect(opacity.pressed).toBeGreaterThan(opacity.hover);
  });
});

describe("shadows", () => {
  it("has all sizes", () => {
    expect(shadows.sm).toContain("2px");
    expect(shadows.md).toContain("8px");
    expect(shadows.lg).toContain("20px");
  });
});

describe("theme", () => {
  it("merges all sections", () => {
    expect(theme.background).toBe(background);
    expect(theme.border).toBe(border);
    expect(theme.text).toBe(text);
    expect(theme.brand).toBe(brand);
    expect(theme.success).toBe(status.success);
    expect(theme.warning).toBe(status.warning);
    expect(theme.danger).toBe(status.danger);
    expect(theme.info).toBe(status.info);
  });
});
