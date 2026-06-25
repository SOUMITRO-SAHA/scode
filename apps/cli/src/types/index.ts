export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface SessionInfo {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  messageCount: number
  model: string
  provider: string
}

export interface ProviderInfo {
  id: string
  name: string
  defaultModel: string
}

export interface ModelInfo {
  provider: string
  providerName: string
  defaultModel: string
}

export interface SkillInfo {
  name: string
  description: string
}

export interface ServerConfig {
  theme: string
  defaultProvider: string
  defaultModel: string
  maxTokens: number
}

export interface HealthStatus {
  healthy: boolean
  uptime: number
  providers: number
  sessions: number
  defaultProvider: string
  defaultModel: string
}

export interface Stats {
  sessions: number
  messages: number
  providers: number
  models: number
  skills: number
  uptime: number
}

export interface LogEntry {
  file: string
  size: number
  content: string
}

export interface AppState {
  serverUrl: string
  currentSessionId: string | undefined
  model: string | undefined
  debug: boolean
  sidebarVisible: boolean
}
