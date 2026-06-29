import { describe, expect, it } from "vitest";

import { Schema } from "effect";

import {
  AppConfig,
  ChatRequest,
  EffortLevel,
  HealthStatus,
  LogEntry,
  LogLevel,
  ProviderInfo,
  SessionInfo,
  Skill,
  SkillInfo,
  Stats,
  StreamChunk,
  StreamEvent,
  ToolDefinition,
  schemaToJsonSchema,
} from "../schema";

function parse<A, I>(schema: Schema.Schema<A, I>, input: I): A {
  const result = Schema.decodeSync(schema)(input);
  return result;
}

describe("EffortLevel", () => {
  it("accepts valid effort levels", () => {
    expect(parse(EffortLevel, "none")).toBe("none");
    expect(parse(EffortLevel, "medium")).toBe("medium");
    expect(parse(EffortLevel, "max")).toBe("max");
  });

  it("rejects invalid effort levels", () => {
    expect(() => parse(EffortLevel, "super")).toThrow();
  });
});

describe("LogLevel", () => {
  it("accepts valid log levels", () => {
    expect(parse(LogLevel, "debug")).toBe("debug");
    expect(parse(LogLevel, "error")).toBe("error");
  });

  it("rejects invalid log levels", () => {
    expect(() => parse(LogLevel, "critical")).toThrow();
  });
});

describe("HealthStatus", () => {
  it("decodes valid health status", () => {
    const result = parse(HealthStatus, {
      healthy: true,
      uptime: 3600,
      providers: 6,
      connectedProviders: 2,
      sessions: 5,
      activeClients: 1,
      defaultProvider: "claude",
      defaultModel: "claude-sonnet-4-20250515",
    });
    expect(result.healthy).toBe(true);
    expect(result.uptime).toBe(3600);
  });
});

describe("ProviderInfo", () => {
  it("decodes with optional connected field", () => {
    const withConnected = parse(ProviderInfo, {
      id: "claude",
      name: "Anthropic",
      defaultModel: "claude-sonnet-4-20250515",
      connected: true,
    });
    expect(withConnected.connected).toBe(true);

    const withoutConnected = parse(ProviderInfo, {
      id: "claude",
      name: "Anthropic",
      defaultModel: "claude-sonnet-4-20250515",
    });
    expect(withoutConnected.connected).toBeUndefined();
  });
});

describe("Skill", () => {
  it("decodes skill with body", () => {
    const result = parse(Skill, {
      name: "test",
      description: "A test skill",
      body: "# Skill body",
    });
    expect(result.name).toBe("test");
    expect(result.body).toBe("# Skill body");
  });
});

describe("SkillInfo", () => {
  it("decodes skill info", () => {
    const result = parse(SkillInfo, {
      name: "test",
      description: "Test description",
    });
    expect(result.name).toBe("test");
    expect(result.description).toBe("Test description");
  });
});

describe("SessionInfo", () => {
  it("decodes session info", () => {
    const result = parse(SessionInfo, {
      id: "abc-123",
      name: "My Session",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T01:00:00Z",
      messageCount: 10,
      model: "claude-sonnet-4",
      provider: "claude",
    });
    expect(result.id).toBe("abc-123");
    expect(result.messageCount).toBe(10);
  });
});

describe("AppConfig", () => {
  it("decodes app config with optional systemPrompt", () => {
    const withPrompt = parse(AppConfig, {
      theme: "dark",
      defaultProvider: "claude",
      defaultModel: "claude-sonnet-4-20250515",
      maxTokens: 8192,
      systemPrompt: "You are helpful",
    });
    expect(withPrompt.systemPrompt).toBe("You are helpful");

    const withoutPrompt = parse(AppConfig, {
      theme: "dark",
      defaultProvider: "claude",
      defaultModel: "claude-sonnet-4-20250515",
      maxTokens: 8192,
    });
    expect(withoutPrompt.systemPrompt).toBeUndefined();
  });
});

describe("Stats", () => {
  it("decodes stats", () => {
    const result = parse(Stats, {
      sessions: 10,
      messages: 100,
      providers: 3,
      models: 5,
      skills: 2,
      uptime: 7200,
    });
    expect(result.sessions).toBe(10);
    expect(result.messages).toBe(100);
  });
});

describe("LogEntry", () => {
  it("decodes log entry", () => {
    const result = parse(LogEntry, {
      file: "scode.2025-01-01.log",
      size: 1024,
      content: "some log content",
    });
    expect(result.file).toBe("scode.2025-01-01.log");
    expect(result.size).toBe(1024);
  });
});

describe("ToolDefinition", () => {
  it("decodes tool definition", () => {
    const result = parse(ToolDefinition, {
      name: "read",
      description: "Read files",
      inputSchema: { type: "object", properties: {} },
    });
    expect(result.name).toBe("read");
    expect(result.inputSchema).toEqual({ type: "object", properties: {} });
  });
});

describe("ChatRequest", () => {
  it("decodes with all optional fields", () => {
    const full = parse(ChatRequest, {
      message: "hello",
      model: "claude-sonnet-4",
      provider: "claude",
      effortLevel: "high",
    });
    expect(full.message).toBe("hello");
    expect(full.effortLevel).toBe("high");

    const minimal = parse(ChatRequest, {});
    expect(minimal.message).toBeUndefined();
  });
});

describe("StreamChunk", () => {
  it("decodes text chunk", () => {
    const result = parse(StreamChunk, { type: "text", delta: "Hello" });
    expect(result.type).toBe("text");
    if (result.type === "text") {
      expect(result.delta).toBe("Hello");
    }
  });

  it("decodes meta chunk", () => {
    const result = parse(StreamChunk, {
      type: "meta",
      sessionId: "s1",
      model: "claude",
    });
    expect(result.type).toBe("meta");
    if (result.type === "meta") {
      expect(result.sessionId).toBe("s1");
    }
  });

  it("decodes error chunk", () => {
    const result = parse(StreamChunk, { type: "error", message: "fail" });
    expect(result.type).toBe("error");
    if (result.type === "error") {
      expect(result.message).toBe("fail");
    }
  });
});

describe("StreamEvent", () => {
  it("decodes done event", () => {
    const result = parse(StreamEvent, { type: "done" });
    expect(result.type).toBe("done");
  });

  it("decodes tool_use event", () => {
    const result = parse(StreamEvent, {
      type: "tool_use",
      toolCall: {
        id: "call_1",
        name: "read",
        input: { path: "/tmp/test" },
      },
    });
    expect(result.type).toBe("tool_use");
    if (result.type === "tool_use") {
      expect(result.toolCall.name).toBe("read");
    }
  });
});

describe("schemaToJsonSchema", () => {
  it("converts string schema", () => {
    expect(schemaToJsonSchema(Schema.String)).toEqual({ type: "string" });
  });

  it("converts number schema", () => {
    expect(schemaToJsonSchema(Schema.Number)).toEqual({ type: "number" });
  });

  it("converts boolean schema", () => {
    expect(schemaToJsonSchema(Schema.Boolean)).toEqual({ type: "boolean" });
  });

  it("converts struct with required fields", () => {
    const schema = Schema.Struct({ name: Schema.String, age: Schema.Number });
    expect(schemaToJsonSchema(schema)).toEqual({
      type: "object",
      properties: { name: { type: "string" }, age: { type: "number" } },
      required: ["name", "age"],
    });
  });

  it("converts struct with optional fields", () => {
    const schema = Schema.Struct({
      name: Schema.String,
      count: Schema.optional(Schema.Number),
    });
    expect(schemaToJsonSchema(schema)).toEqual({
      type: "object",
      properties: { name: { type: "string" }, count: { type: "number" } },
      required: ["name"],
    });
  });

  it("returns { type: 'string' } for unknown types", () => {
    expect(
      schemaToJsonSchema(
        Schema.Literal("a", "b") as unknown as Schema.Schema<unknown>,
      ),
    ).toEqual({ type: "string" });
  });

  it("converts array schema", () => {
    expect(schemaToJsonSchema(Schema.Array(Schema.String))).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });

  it("converts array of structs", () => {
    const schema = Schema.Array(Schema.Struct({ name: Schema.String }));
    expect(schemaToJsonSchema(schema)).toEqual({
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    });
  });
});
