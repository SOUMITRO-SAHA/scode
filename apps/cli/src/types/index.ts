export type {
  Message,
  SessionInfo,
  ProviderInfo,
  ModelInfo,
  SkillInfo,
  ServerConfig,
  HealthStatus,
  Stats,
  LogEntry,
} from "@scode/shared/types"

export interface AppState {
  serverUrl: string
  currentSessionId: string | undefined
  model: string | undefined
  debug: boolean
  sidebarVisible: boolean
}
