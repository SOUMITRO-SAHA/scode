import { useCallback, useRef } from "react";

import { Readable } from "node:stream";

import { useAppStore } from "../store/index";

import { useToast } from "@/components/ui/toast";
import { DebugLogger } from "@scode/shared/logger";
import { decodeStreamChunk } from "@scode/shared/types";
import { apiFetch, apiFetchStream } from "@scode/shared/utils";
import { useQueryClient } from "@tanstack/react-query";

const decoder = new TextDecoder();
const dbg = new DebugLogger("client:stream");

function processStreamChunk(chunk: string, buffer: string): string {
  buffer += chunk;
  const lines = buffer.split("\n");
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parsed = decodeStreamChunk(line);
    if (!parsed) {
      dbg.warn("unparseable chunk, treating as plain text", {
        line: line.slice(0, 80),
      });
      useAppStore.getState().appendAssistantChunk(line);
      continue;
    }
    switch (parsed.type) {
      case "text": {
        useAppStore.getState().appendAssistantChunk(parsed.delta);
        break;
      }
      case "thought": {
        useAppStore.getState().appendThought(parsed.text);
        break;
      }
      case "error": {
        useAppStore.getState().setLastAssistantError(parsed.message);
        break;
      }
      case "meta": {
        // meta events are informational, no UI update needed
        break;
      }
    }
  }
  return lines[lines.length - 1];
}

export function useStreamChat(serverUrl: string) {
  const toast = useToast();
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

      useAppStore.getState().clearThought();
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
          toast.show({ variant: "success", message: "Session created" });
          dbg.log("session created", { sessionId });
        }

        // Set streaming session ID
        setStreamingSession(sessionId);

        const model = useAppStore.getState().model;
        const effortLevel = useAppStore.getState().effortLevel;
        dbg.log("opening stream", { sessionId, model, endpoint: "/chat" });
        const stream = await apiFetchStream(
          "/chat",
          {
            message: text,
            model,
            sessionId,
            effortLevel,
          },
          serverUrl,
        );

        useAppStore.getState().addAssistantMessage();
        dbg.log("stream connected, reading chunks");

        let chunkCount = 0;
        let totalBytes = 0;
        let buffer = "";
        for await (const chunk of stream as Readable) {
          const t = decoder.decode(chunk as Uint8Array, { stream: true });
          chunkCount++;
          totalBytes += t.length;
          buffer = processStreamChunk(t, buffer);
        }
        dbg.log("stream finished", { chunkCount, totalBytes });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        dbg.error("stream failed", { error: errMsg });
        useAppStore.getState().setLastAssistantError(errMsg);
        toast.show({ variant: "error", message: errMsg });
      } finally {
        dbg.log("stream flow complete, resetting state");
        useAppStore.getState().setStreaming(false);
        setStreamingSession(undefined);
        statusRef.current = "idle";
        qc.invalidateQueries({ queryKey: ["sessions", serverUrl] });
      }
    },
    [serverUrl, qc, toast],
  );

  return {
    messages,
    streaming,
    sessionId: sessionIdRef.current,
    setSessionId,
    submit,
  };
}
