import { create } from "zustand";

import type { Message } from "@scode/shared/types";

export type AgentId = "plan" | "write" | "chat";
export type EffortLevel = "low" | "medium" | "high";

export const AGENTS: AgentId[] = ["plan", "write", "chat"];

export const EFFORT_LEVELS: EffortLevel[] = ["low", "medium", "high"];

export const AGENT_LABELS: Record<AgentId, string> = {
  plan: "Plan",
  write: "Write",
  chat: "Chat",
};

interface AppStore {
  serverUrl: string;
  currentSessionId: string | undefined;
  streamingSessionId: string | undefined;
  model: string | undefined;
  effortLevel: EffortLevel;
  debug: boolean;
  sidebarVisible: boolean;
  messages: Message[];
  streaming: boolean;
  currentAgent: AgentId;
  sidebarSelectedIndex: number;

  setServerUrl: (url: string) => void;
  setCurrentSessionId: (id: string | undefined) => void;
  setStreamingSessionId: (id: string | undefined) => void;
  setModel: (m: string | undefined) => void;
  setEffortLevel: (level: EffortLevel) => void;
  toggleDebug: () => void;
  toggleSidebar: () => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: () => void;
  appendAssistantChunk: (chunk: string) => void;
  setLastAssistantError: (err: string) => void;
  addSystemMessage: (text: string) => void;
  clearMessages: () => void;
  setStreaming: (s: boolean) => void;
  cycleAgent: () => void;
  setSidebarSelectedIndex: (i: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  serverUrl: "",
  currentSessionId: undefined,
  streamingSessionId: undefined,
  model: undefined,
  effortLevel: "high",
  debug: false,
  sidebarVisible: false,
  messages: [],
  streaming: false,
  currentAgent: "chat",
  sidebarSelectedIndex: 0,

  setServerUrl: (url) => set({ serverUrl: url }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setStreamingSessionId: (id) => set({ streamingSessionId: id }),
  setModel: (m) => set({ model: m }),
  setEffortLevel: (level) => set({ effortLevel: level }),
  toggleDebug: () => set((s) => ({ debug: !s.debug })),
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  addUserMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { role: "user" as const, content }],
    })),
  addAssistantMessage: () =>
    set((s) => ({
      messages: [...s.messages, { role: "assistant" as const, content: "" }],
    })),
  appendAssistantChunk: (chunk) =>
    set((s) => {
      const copy = [...s.messages];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: last.content + chunk };
      }
      return { messages: copy };
    }),
  setLastAssistantError: (err) =>
    set((s) => {
      const copy = [...s.messages];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: `Error: ${err}` };
      }
      return { messages: copy };
    }),
  addSystemMessage: (text) =>
    set((s) => ({
      messages: [...s.messages, { role: "system" as const, content: text }],
    })),
  clearMessages: () => set({ messages: [], streaming: false }),
  setStreaming: (s) => set({ streaming: s }),
  cycleAgent: () =>
    set((s) => {
      const idx = AGENTS.indexOf(s.currentAgent);
      return { currentAgent: AGENTS[(idx + 1) % AGENTS.length] };
    }),
  setSidebarSelectedIndex: (i) => set({ sidebarSelectedIndex: i }),
}));
