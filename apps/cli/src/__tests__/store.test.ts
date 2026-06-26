import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "../store";

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

  it("adds a user message", () => {
    useAppStore.getState().addUserMessage("hello");
    const msgs = useAppStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({ role: "user", content: "hello" });
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

  it("sets last assistant error", () => {
    useAppStore.getState().addAssistantMessage();
    useAppStore.getState().setLastAssistantError("timeout");
    const msgs = useAppStore.getState().messages;
    expect(msgs[0].content).toBe("Error: timeout");
  });
});
