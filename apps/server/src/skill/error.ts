import { Data } from "effect";

export class SkillDiscoverError extends Data.TaggedError("SkillDiscoverError")<{
  readonly dir: string;
  readonly message: string;
}> {
  override get message(): string {
    return `Failed to discover skills in ${this.dir}: ${this.message}`;
  }
}

export class SkillLoadError extends Data.TaggedError("SkillLoadError")<{
  readonly dir: string;
  readonly reason:
    | "missing-file"
    | "invalid-frontmatter"
    | "missing-name"
    | "invalid-name"
    | "parse-error";
  readonly detail?: string;
}> {
  override get message(): string {
    const base = `Failed to load skill from ${this.dir}`;
    switch (this.reason) {
      case "missing-file":
        return `${base}: SKILL.md not found`;
      case "invalid-frontmatter":
        return `${base}: invalid frontmatter${this.detail ? ` — ${this.detail}` : ""}`;
      case "missing-name":
        return `${base}: missing required 'name' field`;
      case "invalid-name":
        return `${base}: invalid name${this.detail ? ` — ${this.detail}` : ""}`;
      case "parse-error":
        return `${base}: parse error${this.detail ? ` — ${this.detail}` : ""}`;
    }
  }
}
