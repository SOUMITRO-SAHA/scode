import { useCallback, useRef } from "react";

import { Readable } from "node:stream";

import { useAppStore } from "../store/index";

import { apiFetch, apiFetchStream } from "@scode/shared/utils";
import { useQueryClient } from "@tanstack/react-query";

const decoder = new TextDecoder();

export function useStreamChat(serverUrl: string) {
  const sessionIdRef = useRef<string | undefined>(undefined);
  const statusRef = useRef<"idle" | "streaming">("idle");
  const qc = useQueryClient();
  const streaming = useAppStore((s) => s.streaming);
  const messages = useAppStore((s) => s.messages);

  const setSessionId = useCallback((id: string | undefined) => {
    sessionIdRef.current = id;
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const current = useAppStore.getState();
      if (!text.trim() || current.streaming) return;

      useAppStore.getState().addUserMessage(text);
      useAppStore.getState().setStreaming(true);
      statusRef.current = "streaming";

      let sessionId = sessionIdRef.current;

      // Set streaming session ID after we have the session
      const setStreamingSession = (id: string | undefined) => {
        useAppStore.getState().setStreamingSessionId(id);
      };

      try {
        if (!sessionId) {
          const config = await apiFetch<{ defaultModel: string }>(
            "/config",
            {},
            serverUrl,
          );
          const m = useAppStore.getState().model ?? config.defaultModel;
          if (!m) {
            throw new Error(
              "No model selected. Use Ctrl+M or /models command to select a model.",
            );
          }
          const session = await apiFetch<{ id: string }>(
            "/sessions",
            {
              method: "POST",
              body: JSON.stringify({ name: text.slice(0, 60), model: m }),
            },
            serverUrl,
          );
          sessionId = session.id;
          sessionIdRef.current = sessionId;
          useAppStore.getState().setCurrentSessionId(sessionId);
        }

        // Set streaming session ID
        setStreamingSession(sessionId);

        const stream = await apiFetchStream(
          "/chat",
          {
            message: text,
            model: useAppStore.getState().model,
            sessionId,
          },
          serverUrl,
        );

        useAppStore.getState().addAssistantMessage();

        for await (const chunk of stream as Readable) {
          const t = decoder.decode(chunk as Uint8Array, { stream: true });
          useAppStore.getState().appendAssistantChunk(t);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        useAppStore.getState().setLastAssistantError(errMsg);
      } finally {
        useAppStore.getState().setStreaming(false);
        setStreamingSession(undefined);
        statusRef.current = "idle";
        qc.invalidateQueries({ queryKey: ["sessions", serverUrl] });
      }
    },
    [serverUrl, qc],
  );

  return {
    messages,
    streaming,
    sessionId: sessionIdRef.current,
    setSessionId,
    submit,
  };
}
