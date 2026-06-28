export interface ProviderInfo {
  id: string;
  name: string;
  defaultModel: string;
  connected?: boolean;
}

export interface ModelInfo {
  provider: string;
  providerName: string;
  defaultModel: string;
  supportedEfforts: string[];
}

export interface SkillInfo {
  name: string;
  description: string;
}

export interface Skill {
  name: string;
  description: string;
  body: string;
}

export interface SessionInfo {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  model: string;
  provider: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages: UnifiedMessage[];
  model: string;
  provider: string;
}

export interface AppConfig {
  theme: string;
  defaultProvider: string;
  defaultModel: string;
  maxTokens: number;
  systemPrompt?: string;
}

export type ServerConfig = AppConfig;

export interface LogEntry {
  file: string;
  size: number;
  content: string;
}

export interface HealthStatus {
  healthy: boolean;
  uptime: number;
  providers: number;
  sessions: number;
  defaultProvider: string;
  defaultModel: string;
}

export interface Stats {
  sessions: number;
  messages: number;
  providers: number;
  models: number;
  skills: number;
  uptime: number;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCallState[];
}

export interface ToolCallState {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "running" | "completed" | "failed";
  result?: string;
  isError?: boolean;
}

export interface UnifiedMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentBlock[];
  tool_call_id?: string;
  name?: string;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | { type: "tool_result"; tool_use_id: string; content: string };

export type EffortLevel =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
