export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AppState {
  model?: string
  currentSessionId?: string
  debug: boolean
  serverUrl: string
}
