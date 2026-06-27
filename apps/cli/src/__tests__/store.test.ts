import { beforeEach, describe, expect, it } from "vitest";

import { AGENTS, useAppStore } from "../store";

import { EFFORT_LEVELS } from "@scode/shared/constants";

describe("AppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      serverUrl: "",
      currentSessionId: undefined,
      model: undefined,
      effortLevel: "high",
      debug: false,
      sidebarVisible: false,
      messages: [],
      streaming: false,
      currentAgent: "chat",
    });
  });

  it("has initial state", () => {
    const s = useAppStore.getState();
    expect(s.serverUrl).toBe("");
    expect(s.currentSessionId).toBeUndefined();
    expect(s.model).toBeUndefined();
    expect(s.effortLevel).toBe("high");
    expect(s.debug).toBe(false);
    expect(s.sidebarVisible).toBe(false);
    expect(s.messages).toEqual([]);
    expect(s.streaming).toBe(false);
    expect(s.currentAgent).toBe("chat");
  });

  it("sets server URL", () => {
    useAppStore.getState().setServerUrl("http://localhost:4100");
    expect(useAppStore.getState().serverUrl).toBe("http://localhost:4100");
  });

  it("sets current session ID", () => {
    useAppStore.getState().setCurrentSessionId("abc");
    expect(useAppStore.getState().currentSessionId).toBe("abc");
    useAppStore.getState().setCurrentSessionId(undefined);
    expect(useAppStore.getState().currentSessionId).toBeUndefined();
  });

  it("sets model", () => {
    useAppStore.getState().setModel("claude/claude-sonnet-4");
    expect(useAppStore.getState().model).toBe("claude/claude-sonnet-4");
    useAppStore.getState().setModel(undefined);
    expect(useAppStore.getState().model).toBeUndefined();
  });

  it("sets effort level", () => {
    useAppStore.getState().setEffortLevel("low");
    expect(useAppStore.getState().effortLevel).toBe("low");
    useAppStore.getState().setEffortLevel("medium");
    expect(useAppStore.getState().effortLevel).toBe("medium");
    useAppStore.getState().setEffortLevel("high");
    expect(useAppStore.getState().effortLevel).toBe("high");
  });

  it("toggles sidebar", () => {
    expect(useAppStore.getState().sidebarVisible).toBe(false);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarVisible).toBe(true);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarVisible).toBe(false);
  });

  it("adds a user message", () => {
    useAppStore.getState().addUserMessage("hello");
    const msgs = useAppStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({ role: "user", content: "hello" });
  });

  it("adds multiple user messages", () => {
    useAppStore.getState().addUserMessage("first");
    useAppStore.getState().addUserMessage("second");
    expect(useAppStore.getState().messages).toHaveLength(2);
  });

  it("adds an assistant message with empty content", () => {
    useAppStore.getState().addAssistantMessage();
    const msgs = useAppStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({ role: "assistant", content: "" });
  });

  it("appends chunks to the last assistant message", () => {
    useAppStore.getState().addAssistantMessage();
    useAppStore.getState().appendAssistantChunk("Hel");
    useAppStore.getState().appendAssistantChunk("lo");
    const msgs = useAppStore.getState().messages;
    expect(msgs[0].content).toBe("Hello");
  });

  it("does not append chunk when last message is not assistant", () => {
    useAppStore.getState().addUserMessage("hi");
    useAppStore.getState().appendAssistantChunk("should-not-appear");
    const msgs = useAppStore.getState().messages;
    expect(msgs[0].content).toBe("hi");
  });

  it("sets last assistant error", () => {
    useAppStore.getState().addAssistantMessage();
    useAppStore.getState().setLastAssistantError("timeout");
    const msgs = useAppStore.getState().messages;
    expect(msgs[0].content).toBe("Error: timeout");
  });

  it("creates assistant message with error when no assistant message exists", () => {
    useAppStore.getState().setLastAssistantError("fail");
    const msgs = useAppStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({ role: "assistant", content: "Error: fail" });
  });

  it("adds system message", () => {
    useAppStore.getState().addSystemMessage("system note");
    const msgs = useAppStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({ role: "system", content: "system note" });
  });

  it("cycles through agents in order", () => {
    expect(useAppStore.getState().currentAgent).toBe("chat");
    useAppStore.getState().cycleAgent();
    expect(useAppStore.getState().currentAgent).toBe("plan");
    useAppStore.getState().cycleAgent();
    expect(useAppStore.getState().currentAgent).toBe("write");
    useAppStore.getState().cycleAgent();
    expect(useAppStore.getState().currentAgent).toBe("chat");
  });

  it("toggles debug flag", () => {
    expect(useAppStore.getState().debug).toBe(false);
    useAppStore.getState().toggleDebug();
    expect(useAppStore.getState().debug).toBe(true);
    useAppStore.getState().toggleDebug();
    expect(useAppStore.getState().debug).toBe(false);
  });

  it("clears messages and resets streaming", () => {
    useAppStore.getState().addUserMessage("hello");
    useAppStore.getState().setStreaming(true);
    useAppStore.getState().clearMessages();
    expect(useAppStore.getState().messages).toHaveLength(0);
    expect(useAppStore.getState().streaming).toBe(false);
  });

  it("sets streaming flag", () => {
    useAppStore.getState().setStreaming(true);
    expect(useAppStore.getState().streaming).toBe(true);
    useAppStore.getState().setStreaming(false);
    expect(useAppStore.getState().streaming).toBe(false);
  });

  it("exports constants", () => {
    expect(AGENTS).toEqual(["plan", "write", "chat"]);
    expect(EFFORT_LEVELS).toEqual(["low", "medium", "high"]);
  });
});
