import { create } from "zustand";

import { EFFORT_LEVELS } from "@scode/shared/constants";
import type {
  EffortLevel,
  Message,
  ToolCallState,
  UnifiedMessage,
} from "@scode/shared/types";

export type AgentId = "plan" | "write" | "chat";

export const AGENTS: AgentId[] = ["plan", "write", "chat"];

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
  supportedEfforts: string[];
  debug: boolean;
  sidebarVisible: boolean;
  messages: Message[];
  streaming: boolean;
  currentAgent: AgentId;
  sidebarSelectedIndex: number;
  selectedSkills: string[];
  thought: string;
  thoughtStartTime: number;

  setServerUrl: (url: string) => void;
  setCurrentSessionId: (id: string | undefined) => void;
  setStreamingSessionId: (id: string | undefined) => void;
  setModel: (m: string | undefined) => void;
  setEffortLevel: (level: EffortLevel) => void;
  setSupportedEfforts: (efforts: string[]) => void;
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
  setCurrentAgent: (agent: AgentId) => void;
  setSidebarSelectedIndex: (i: number) => void;
  setMessages: (messages: UnifiedMessage[]) => void;
  addSelectedSkill: (name: string) => void;
  removeSelectedSkill: (name: string) => void;
  clearSelectedSkills: () => void;
  appendThought: (text: string) => void;
  clearThought: () => void;
  commitThought: () => void;
  addToolCall: (toolCall: ToolCallState) => void;
  updateToolCall: (id: string, update: Partial<ToolCallState>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  serverUrl: "",
  currentSessionId: undefined,
  streamingSessionId: undefined,
  model: undefined,
  effortLevel: "high",
  supportedEfforts: [],
  debug: false,
  sidebarVisible: false,
  messages: [],
  streaming: false,
  currentAgent: "chat",
  sidebarSelectedIndex: 0,
  selectedSkills: [],
  thought: "",
  thoughtStartTime: 0,

  setServerUrl: (url) => set({ serverUrl: url }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setStreamingSessionId: (id) => set({ streamingSessionId: id }),
  setModel: (m) => set({ model: m }),
  setEffortLevel: (level) => set({ effortLevel: level }),
  setSupportedEfforts: (efforts) => set({ supportedEfforts: efforts }),
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
      } else {
        copy.push({ role: "assistant", content: `Error: ${err}` });
      }
      return { messages: copy };
    }),
  addSystemMessage: (text) =>
    set((s) => ({
      messages: [...s.messages, { role: "system" as const, content: text }],
    })),
  clearMessages: () =>
    set({ messages: [], streaming: false, thought: "", thoughtStartTime: 0 }),
  setStreaming: (s) => set({ streaming: s }),
  cycleAgent: () =>
    set((s) => {
      const idx = AGENTS.indexOf(s.currentAgent);
      return { currentAgent: AGENTS[(idx + 1) % AGENTS.length] };
    }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setSidebarSelectedIndex: (i) => set({ sidebarSelectedIndex: i }),
  setMessages: (unifiedMessages) =>
    set(() => {
      const messages: Message[] = [];
      const pendingResults = new Map<
        string,
        { msgIdx: number; tcIdx: number }
      >();
      let lastThought = "";

      for (const m of unifiedMessages) {
        if (m.role === "user" || m.role === "system") {
          messages.push({
            role: m.role,
            content: typeof m.content === "string" ? m.content : "",
          });
        } else if (m.role === "assistant") {
          if (Array.isArray(m.content)) {
            const toolUseBlocks = m.content.filter(
              (
                b,
              ): b is {
                type: "tool_use";
                id: string;
                name: string;
                input: Record<string, unknown>;
              } => b.type === "tool_use",
            );
            const textBlocks = m.content.filter(
              (b): b is { type: "text"; text: string } => b.type === "text",
            );

            if (toolUseBlocks.length > 0) {
              const toolCalls: ToolCallState[] = toolUseBlocks.map((b) => ({
                id: b.id,
                name: b.name,
                input: b.input,
                status: "completed" as const,
              }));
              const msgIdx = messages.length;
              messages.push({
                role: "assistant",
                content: textBlocks.map((b) => b.text).join(""),
                toolCalls,
              });
              toolUseBlocks.forEach((b, i) => {
                pendingResults.set(b.id, { msgIdx, tcIdx: i });
              });
            } else {
              messages.push({
                role: "assistant",
                content: textBlocks.map((b) => b.text).join(""),
              });
            }
          } else {
            const msg: Message = {
              role: "assistant",
              content: m.content,
            };
            if (m.thought) {
              msg.thought = m.thought;
              lastThought = m.thought;
            }
            messages.push(msg);
          }
        } else if (m.role === "tool") {
          if (m.tool_call_id && pendingResults.has(m.tool_call_id)) {
            const { msgIdx, tcIdx } = pendingResults.get(m.tool_call_id)!;
            const target = messages[msgIdx];
            if (target?.toolCalls?.[tcIdx]) {
              target.toolCalls[tcIdx].result =
                typeof m.content === "string"
                  ? m.content
                  : JSON.stringify(m.content);
              target.toolCalls[tcIdx].status = "completed";
            }
            pendingResults.delete(m.tool_call_id);
          }
        }
      }

      return {
        messages,
        thought: lastThought,
        thoughtStartTime: lastThought ? Date.now() : 0,
      };
    }),
  addSelectedSkill: (name) =>
    set((s) => ({
      selectedSkills: s.selectedSkills.includes(name)
        ? s.selectedSkills
        : [...s.selectedSkills, name],
    })),
  removeSelectedSkill: (name) =>
    set((s) => ({
      selectedSkills: s.selectedSkills.filter((n) => n !== name),
    })),
  clearSelectedSkills: () => set({ selectedSkills: [] }),
  appendThought: (text) =>
    set((s) => ({
      thought: s.thought + text,
      thoughtStartTime:
        s.thoughtStartTime === 0 ? Date.now() : s.thoughtStartTime,
    })),
  clearThought: () => set({ thought: "", thoughtStartTime: 0 }),
  commitThought: () =>
    set((s) => {
      if (!s.thought || s.messages.length === 0) return {};
      const copy = [...s.messages];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        copy[copy.length - 1] = { ...last, thought: s.thought };
      }
      return { messages: copy, thought: "", thoughtStartTime: 0 };
    }),
  addToolCall: (toolCall) =>
    set((s) => {
      const copy = [...s.messages];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        const existing = last.toolCalls ?? [];
        copy[copy.length - 1] = {
          ...last,
          toolCalls: [...existing, toolCall],
        };
      }
      return { messages: copy };
    }),
  updateToolCall: (id, update) =>
    set((s) => {
      const copy = [...s.messages];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant" && last.toolCalls) {
        copy[copy.length - 1] = {
          ...last,
          toolCalls: last.toolCalls.map((tc) =>
            tc.id === id ? { ...tc, ...update } : tc,
          ),
        };
      }
      return { messages: copy };
    }),
}));
