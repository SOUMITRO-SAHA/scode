import { describe, expect, it } from "vitest";

import { Effect } from "effect";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { SkillDir } from "../skill/discover";
import { loadSkill, loadSkillMeta } from "../skill/loader";

function writeSkill(
  dirPath: string,
  yaml: Record<string, string>,
  body = "",
): void {
  const lines = Object.entries(yaml).map(([k, v]) => `${k}: ${v}`);
  const content = `---\n${lines.join("\n")}\n---${body ? `\n${body}` : ""}`;
  writeFileSync(join(dirPath, "SKILL.md"), content);
}

function makeSkillDir(
  name: string,
  yaml: Record<string, string>,
  body = "",
): SkillDir {
  const base = mkdtempSync(join(tmpdir(), "sk-"));
  const p = join(base, name);
  mkdirSync(p);
  writeSkill(p, yaml, body);
  return { name, path: p };
}

function cleanup(d: SkillDir): void {
  rmSync(join(d.path, ".."), { recursive: true, force: true });
}

function run<E, A>(effect: Effect.Effect<A, E>): A {
  return Effect.runSync(effect);
}

function emptyDir(name: string): SkillDir {
  const base = mkdtempSync(join(tmpdir(), "sk-"));
  const p = join(base, name);
  mkdirSync(p);
  return { name, path: p };
}

describe("loadSkillMeta", () => {
  it("returns null when SKILL.md is missing", () => {
    const d = emptyDir("missing-file");
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("returns null for invalid YAML frontmatter", () => {
    const d = emptyDir("bad-yaml");
    writeFileSync(join(d.path, "SKILL.md"), "not-a-frontmatter");
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("returns null for missing frontmatter delimiter", () => {
    const d = emptyDir("plain");
    writeFileSync(join(d.path, "SKILL.md"), "plain text");
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("parses valid frontmatter with name and description", () => {
    const d = makeSkillDir("valid-skill", {
      name: "valid-skill",
      description: "A valid skill",
    });
    expect(run(loadSkillMeta(d))).toEqual({
      name: "valid-skill",
      description: "A valid skill",
    });
    cleanup(d);
  });

  it("returns null when name is missing", () => {
    const d = emptyDir("noname");
    writeSkill(d.path, { description: "No name here" });
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("returns null when description is missing", () => {
    const d = emptyDir("nodesc");
    writeSkill(d.path, { name: "nodesc" });
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("returns null when description is empty", () => {
    const d = emptyDir("emptydesc");
    writeSkill(d.path, { name: "emptydesc", description: "" });
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("accepts skill with consecutive hyphens in name (lenient)", () => {
    const d = emptyDir("bad--name");
    writeSkill(d.path, { name: "bad--name", description: "Has --" });
    expect(run(loadSkillMeta(d))).toEqual({
      name: "bad--name",
      description: "Has --",
    });
    cleanup(d);
  });

  it("accepts skill with name exceeding 64 characters (lenient)", () => {
    const longName = "a".repeat(65);
    const d = emptyDir(longName);
    writeSkill(d.path, { name: longName, description: "Too long" });
    expect(run(loadSkillMeta(d))).toEqual({
      name: longName,
      description: "Too long",
    });
    cleanup(d);
  });

  it("accepts skill when name does not match directory name (lenient)", () => {
    const d = emptyDir("mismatch");
    writeSkill(d.path, { name: "wrong-name", description: "Mismatched" });
    expect(run(loadSkillMeta(d))).toEqual({
      name: "wrong-name",
      description: "Mismatched",
    });
    cleanup(d);
  });

  it("returns null when description exceeds 1024 characters", () => {
    const d = emptyDir("longdesc");
    writeSkill(d.path, {
      name: "longdesc",
      description: "x".repeat(1025),
    });
    expect(run(loadSkillMeta(d))).toBeNull();
    cleanup(d);
  });

  it("handles unquoted colons in description via YAML fallback", () => {
    const p = mkdtempSync(join(tmpdir(), "sk-"));
    const name = "pdf-skill";
    const skillDir = join(p, name);
    mkdirSync(skillDir);
    // Description with unquoted colon — common YAML issue
    writeFileSync(
      join(skillDir, "SKILL.md"),
      "---\nname: pdf-skill\ndescription: Use when: user asks about PDFs or: needs extraction\n---",
    );
    const d: SkillDir = { name, path: skillDir };
    expect(run(loadSkillMeta(d))).toEqual({
      name: "pdf-skill",
      description: "Use when: user asks about PDFs or: needs extraction",
    });
    rmSync(p, { recursive: true, force: true });
  });

  it("accepts a 64-character name", () => {
    const name = "a".repeat(64);
    const d = makeSkillDir(name, { name, description: "Max length name" });
    expect(run(loadSkillMeta(d))).toEqual({
      name,
      description: "Max length name",
    });
    cleanup(d);
  });

  it("accepts a 1024-character description", () => {
    const d = makeSkillDir("maxdesc", {
      name: "maxdesc",
      description: "x".repeat(1024),
    });
    expect(run(loadSkillMeta(d))).toEqual({
      name: "maxdesc",
      description: "x".repeat(1024),
    });
    cleanup(d);
  });

  it("accepts skill when name starts with hyphen (lenient)", () => {
    const d = emptyDir("-bad");
    writeSkill(d.path, { name: "-bad", description: "Starts with hyphen" });
    expect(run(loadSkillMeta(d))).toEqual({
      name: "-bad",
      description: "Starts with hyphen",
    });
    cleanup(d);
  });

  it("accepts skill when name ends with hyphen (lenient)", () => {
    const d = emptyDir("bad-");
    writeSkill(d.path, { name: "bad-", description: "Ends with hyphen" });
    expect(run(loadSkillMeta(d))).toEqual({
      name: "bad-",
      description: "Ends with hyphen",
    });
    cleanup(d);
  });
});

describe("loadSkill", () => {
  it("returns null when SKILL.md is missing", () => {
    const d = emptyDir("missing-file");
    expect(run(loadSkill(d))).toBeNull();
    cleanup(d);
  });

  it("returns full skill with body", () => {
    const d = makeSkillDir(
      "full-skill",
      { name: "full-skill", description: "A full skill" },
      "# Instructions\n\nDo the thing.",
    );
    expect(run(loadSkill(d))).toEqual({
      name: "full-skill",
      description: "A full skill",
      body: "# Instructions\n\nDo the thing.",
    });
    cleanup(d);
  });

  it("returns empty body when no content after frontmatter", () => {
    const d = makeSkillDir("emptybody", {
      name: "emptybody",
      description: "No body",
    });
    expect(run(loadSkill(d))).toEqual({
      name: "emptybody",
      description: "No body",
      body: "",
    });
    cleanup(d);
  });

  it("returns null when description is missing (even with body)", () => {
    const d = emptyDir("nodesc");
    writeSkill(d.path, { name: "nodesc" }, "# Body here but no description");
    expect(run(loadSkill(d))).toBeNull();
    cleanup(d);
  });
});
