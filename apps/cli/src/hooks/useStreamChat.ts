import { useCallback, useRef } from "react";

import { Readable } from "node:stream";

import { useAppStore } from "../store/index";

import { DebugLogger } from "@scode/shared/logger";
import { apiFetch, apiFetchStream } from "@scode/shared/utils";
import { useQueryClient } from "@tanstack/react-query";

const decoder = new TextDecoder();
const dbg = new DebugLogger("client:stream");

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

      dbg.log("submit", { text: text.slice(0, 120), model: current.model });

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
          dbg.log("fetching config for default model");
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
          dbg.log("creating session", { model: m, name: text.slice(0, 60) });
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
          dbg.log("session created", { sessionId });
        }

        // Set streaming session ID
        setStreamingSession(sessionId);

        const model = useAppStore.getState().model;
        dbg.log("opening stream", { sessionId, model, endpoint: "/chat" });
        const stream = await apiFetchStream(
          "/chat",
          {
            message: text,
            model,
            sessionId,
          },
          serverUrl,
        );

        useAppStore.getState().addAssistantMessage();
        dbg.log("stream connected, reading chunks");

        let chunkCount = 0;
        let totalBytes = 0;
        for await (const chunk of stream as Readable) {
          const t = decoder.decode(chunk as Uint8Array, { stream: true });
          chunkCount++;
          totalBytes += t.length;
          useAppStore.getState().appendAssistantChunk(t);
        }
        dbg.log("stream finished", { chunkCount, totalBytes });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        dbg.error("stream failed", { error: errMsg });
        useAppStore.getState().setLastAssistantError(errMsg);
      } finally {
        dbg.log("stream flow complete, resetting state");
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
