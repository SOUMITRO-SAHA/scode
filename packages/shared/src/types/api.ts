import type {
  ProviderInfo,
  ModelInfo,
  SkillInfo,
  Skill,
  SessionInfo,
  Session,
  UnifiedMessage,
  AppConfig,
  LogEntry,
  Stats,
  HealthStatus,
} from "./entities"

// ── Request Types ──

export interface ChatRequest {
  message?: string
  prompt?: string
  model?: string
  provider?: string
  sessionId?: string
}

export interface CreateSessionRequest {
  name?: string
  model?: string
  provider?: string
}

export interface UpdateSessionRequest {
  name?: string
  model?: string
  provider?: string
}

export interface ConnectProviderRequest {
  provider: string
  apiKey: string
}

export interface SetDefaultProviderRequest {
  provider: string
}

export interface SetDefaultModelRequest {
  model: string
}

export interface UpdateConfigRequest {
  theme?: string
  defaultProvider?: string
  defaultModel?: string
  maxTokens?: number
  systemPrompt?: string
}

// ── Response Types ──

export interface ErrorResponse {
  error: string
}

export interface HealthResponse extends HealthStatus {}

export interface ProvidersResponse {
  providers: ProviderInfo[]
  default: string
}

export interface ConnectProviderResponse {
  ok: boolean
  provider: string
}

export interface DisconnectProviderResponse {
  ok: boolean
  provider: string
}

export interface SetDefaultProviderResponse {
  ok: boolean
  provider: string
  defaultModel: string
}

export interface ModelsResponse {
  models: ModelInfo[]
  defaultModel: string
}

export interface SetDefaultModelResponse {
  ok: boolean
  model: string
  provider: string
}

export interface SessionsListResponse {
  sessions: SessionInfo[]
}

export interface SessionResponse extends Session {}

export interface MessagesResponse {
  messages: UnifiedMessage[]
}

export interface SkillsListResponse {
  skills: SkillInfo[]
}

export interface SkillResponse extends Skill {}

export interface SkillsReloadResponse {
  ok: boolean
  message: string
}

export interface SkillValidationResult {
  name: string
  valid: boolean
  error: string | null
}

export interface SkillsValidateResponse {
  results: SkillValidationResult[]
}

export interface ConfigResponse extends AppConfig {}

export interface LogsResponse {
  logs: LogEntry[]
}

export interface StatsResponse extends Stats {}

export interface DeleteSessionResponse {
  ok: boolean
}
