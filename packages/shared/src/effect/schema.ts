import { Schema } from "effect";

type AstNode = {
  _tag: string;
  propertySignatures?: Array<{ name: string; type: AstNode }>;
  types?: AstNode[];
  rest?: AstNode[];
};

function getTag(schema: Schema.Schema<unknown> | AstNode): string | undefined {
  if (
    "ast" in schema &&
    typeof (schema as Schema.Schema<unknown>).ast === "object"
  ) {
    return ((schema as Schema.Schema<unknown>).ast as AstNode)._tag;
  }
  return (schema as AstNode)._tag;
}

function getPropertySignatures(
  schema: Schema.Schema<unknown> | AstNode,
): Array<{ name: string; type: AstNode }> | undefined {
  if (
    "ast" in schema &&
    typeof (schema as Schema.Schema<unknown>).ast === "object"
  ) {
    return ((schema as Schema.Schema<unknown>).ast as AstNode)
      .propertySignatures;
  }
  return (schema as AstNode).propertySignatures;
}

function getTypes(
  schema: Schema.Schema<unknown> | AstNode,
): AstNode[] | undefined {
  if (
    "ast" in schema &&
    typeof (schema as Schema.Schema<unknown>).ast === "object"
  ) {
    return ((schema as Schema.Schema<unknown>).ast as AstNode).types;
  }
  return (schema as AstNode).types;
}

function getRest(
  schema: Schema.Schema<unknown> | AstNode,
): AstNode[] | undefined {
  if (
    "ast" in schema &&
    typeof (schema as Schema.Schema<unknown>).ast === "object"
  ) {
    return ((schema as Schema.Schema<unknown>).ast as AstNode).rest;
  }
  return (schema as AstNode).rest;
}

function isOptionalType(type: AstNode): boolean {
  if (type._tag === "Union") {
    return (type.types ?? []).some(
      (t) =>
        t._tag === "Undefined" ||
        t._tag === "UndefinedKeyword" ||
        t._tag === "VoidKeyword",
    );
  }
  return false;
}

function unwrapOptional(type: AstNode): AstNode {
  if (type._tag === "Union") {
    const nonUndefined = (type.types ?? []).filter(
      (t) =>
        t._tag !== "Undefined" &&
        t._tag !== "UndefinedKeyword" &&
        t._tag !== "VoidKeyword",
    );
    if (nonUndefined.length === 1) return nonUndefined[0];
  }
  return type;
}

/** Convert an Effect Schema to a JSON Schema object */
export function schemaToJsonSchema(
  schema: Schema.Schema<unknown>,
): Record<string, unknown> {
  const tag = getTag(schema);
  if (!tag) return { type: "string" };

  switch (tag) {
    case "String":
      return { type: "string" };
    case "Number":
      return { type: "number" };
    case "Boolean":
      return { type: "boolean" };
    case "Arrays": {
      const rest = getRest(schema) ?? [];
      if (rest.length === 1) {
        return {
          type: "array",
          items: schemaToJsonSchema(
            rest[0] as unknown as Schema.Schema<unknown>,
          ),
        };
      }
      return { type: "array" };
    }
    case "Objects": {
      const pss = getPropertySignatures(schema);
      const props: Record<string, Record<string, unknown>> = {};
      const required: string[] = [];
      for (const ps of pss ?? []) {
        const innerType = unwrapOptional(ps.type);
        props[ps.name] = schemaToJsonSchema(
          innerType as unknown as Schema.Schema<unknown>,
        );
        if (!isOptionalType(ps.type)) {
          required.push(ps.name);
        }
      }
      const result: Record<string, unknown> = {
        type: "object",
        properties: props,
      };
      if (required.length > 0) result.required = required;
      return result;
    }
    case "Union": {
      const ts = getTypes(schema) ?? [];
      const nonUndefined = ts.filter(
        (t) =>
          t._tag !== "Undefined" &&
          t._tag !== "UndefinedKeyword" &&
          t._tag !== "VoidKeyword",
      );
      if (nonUndefined.length === 1) {
        return schemaToJsonSchema(
          nonUndefined[0] as unknown as Schema.Schema<unknown>,
        );
      }
      return { type: "string" };
    }
    default:
      return { type: "string" };
  }
}

export const EffortLevel = Schema.Literals([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

export const LogLevel = Schema.Literals(["debug", "info", "warn", "error"]);

export const ContentBlockText = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
});

export const ContentBlockToolUse = Schema.Struct({
  type: Schema.Literal("tool_use"),
  id: Schema.String,
  name: Schema.String,
  input: Schema.Record(Schema.String, Schema.Unknown),
});

export const ContentBlockToolResult = Schema.Struct({
  type: Schema.Literal("tool_result"),
  tool_use_id: Schema.String,
  content: Schema.String,
});

export const ContentBlock = Schema.Union([
  ContentBlockText,
  ContentBlockToolUse,
  ContentBlockToolResult,
]);

export const StreamEvent = Schema.Union([
  Schema.Struct({ type: Schema.Literal("text"), delta: Schema.String }),
  Schema.Struct({ type: Schema.Literal("thought"), text: Schema.String }),
  Schema.Struct({
    type: Schema.Literal("tool_use"),
    toolCall: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      input: Schema.Record(Schema.String, Schema.Unknown),
    }),
  }),
  Schema.Struct({ type: Schema.Literal("error"), message: Schema.String }),
  Schema.Struct({ type: Schema.Literal("done") }),
]);

export const StreamChunk = Schema.Union([
  Schema.Struct({ type: Schema.Literal("text"), delta: Schema.String }),
  Schema.Struct({ type: Schema.Literal("thought"), text: Schema.String }),
  Schema.Struct({ type: Schema.Literal("error"), message: Schema.String }),
  Schema.Struct({
    type: Schema.Literal("meta"),
    sessionId: Schema.String,
    model: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    type: Schema.Literal("tool_use"),
    toolCall: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      input: Schema.Record(Schema.String, Schema.Unknown),
    }),
  }),
  Schema.Struct({
    type: Schema.Literal("tool_result"),
    toolUseId: Schema.String,
    name: Schema.String,
    result: Schema.String,
    isError: Schema.optional(Schema.Boolean),
  }),
]);

export const HealthStatus = Schema.Struct({
  healthy: Schema.Boolean,
  uptime: Schema.Number,
  providers: Schema.Number,
  connectedProviders: Schema.Number,
  sessions: Schema.Number,
  activeClients: Schema.Number,
  defaultProvider: Schema.String,
  defaultModel: Schema.String,
});

export const ProviderInfo = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  defaultModel: Schema.String,
  connected: Schema.optional(Schema.Boolean),
});

export const ModelInfo = Schema.Struct({
  provider: Schema.String,
  providerName: Schema.String,
  defaultModel: Schema.String,
  supportedEfforts: Schema.Array(Schema.String),
});

export const SkillInfo = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
});

export const Skill = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  body: Schema.String,
});

export const SessionInfo = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  messageCount: Schema.Number,
  model: Schema.String,
  provider: Schema.String,
});

export const AppConfig = Schema.Struct({
  theme: Schema.String,
  defaultProvider: Schema.String,
  defaultModel: Schema.String,
  maxTokens: Schema.Number,
  systemPrompt: Schema.optional(Schema.String),
});

export const Stats = Schema.Struct({
  sessions: Schema.Number,
  messages: Schema.Number,
  providers: Schema.Number,
  models: Schema.Number,
  skills: Schema.Number,
  uptime: Schema.Number,
});

export const LogEntry = Schema.Struct({
  file: Schema.String,
  size: Schema.Number,
  content: Schema.String,
});

export const ToolDefinition = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  inputSchema: Schema.Record(Schema.String, Schema.Unknown),
});

export const ChatRequest = Schema.Struct({
  message: Schema.optional(Schema.String),
  prompt: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
  sessionId: Schema.optional(Schema.String),
  effortLevel: Schema.optional(EffortLevel),
});

export const CreateSessionRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
});

export const ConnectProviderRequest = Schema.Struct({
  provider: Schema.String,
  apiKey: Schema.String,
});

export const AppConfigUpdate = Schema.Struct({
  theme: Schema.optional(Schema.String),
  defaultProvider: Schema.optional(Schema.String),
  defaultModel: Schema.optional(Schema.String),
  maxTokens: Schema.optional(Schema.Number),
  systemPrompt: Schema.optional(Schema.String),
});

export const ErrorResponse = Schema.Struct({
  error: Schema.String,
});

export const ProvidersResponse = Schema.Struct({
  providers: Schema.Array(ProviderInfo),
  default: Schema.String,
});

export const ModelsResponse = Schema.Struct({
  models: Schema.Array(ModelInfo),
  defaultModel: Schema.String,
});

export const SessionsListResponse = Schema.Struct({
  sessions: Schema.Array(SessionInfo),
});

export const SkillsListResponse = Schema.Struct({
  skills: Schema.Array(SkillInfo),
});

export const LogsResponse = Schema.Struct({
  logs: Schema.Array(LogEntry),
});
