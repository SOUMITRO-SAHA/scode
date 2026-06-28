import { useCallback, useRef } from "react";

import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { Readable } from "node:stream";

import type { StreamError } from "../services/errors";
import { useAppStore } from "../store/index";

import { useToast } from "@/components/ui/toast";
import { CHAT_PATH, CONFIG_PATH, SESSIONS_PATH } from "@scode/shared/constants";
import { DebugLogger } from "@scode/shared/logger";
import { decodeStreamChunk } from "@scode/shared/types";
import type { ToolCallState } from "@scode/shared/types";
import { apiFetch, apiFetchStream, errorMessage } from "@scode/shared/utils";
import { useQueryClient } from "@tanstack/react-query";

const decoder = new TextDecoder();
const dbg = new DebugLogger("client:stream");

let assistantMsgAdded = false;

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
      if (!assistantMsgAdded) {
        useAppStore.getState().addAssistantMessage();
        assistantMsgAdded = true;
      }
      useAppStore.getState().appendAssistantChunk(line);
      continue;
    }
    switch (parsed.type) {
      case "meta": {
        if (parsed.sessionId) {
          useAppStore.getState().setCurrentSessionId(parsed.sessionId);
        }
        break;
      }
      case "text": {
        if (!assistantMsgAdded) {
          useAppStore.getState().addAssistantMessage();
          assistantMsgAdded = true;
        }
        useAppStore.getState().appendAssistantChunk(parsed.delta);
        break;
      }
      case "thought": {
        if (!assistantMsgAdded) {
          useAppStore.getState().addAssistantMessage();
          assistantMsgAdded = true;
        }
        useAppStore.getState().appendThought(parsed.text);
        break;
      }
      case "error": {
        useAppStore.getState().setLastAssistantError(parsed.message);
        assistantMsgAdded = true;
        break;
      }
      case "tool_use": {
        if (!assistantMsgAdded) {
          useAppStore.getState().addAssistantMessage();
          assistantMsgAdded = true;
        }
        const tc: ToolCallState = {
          id: parsed.toolCall.id,
          name: parsed.toolCall.name,
          input: parsed.toolCall.input,
          status: "running",
        };
        useAppStore.getState().addToolCall(tc);
        break;
      }
      case "tool_result": {
        useAppStore.getState().updateToolCall(parsed.toolUseId, {
          status: parsed.isError ? "failed" : "completed",
          result: parsed.result,
          isError: parsed.isError,
        });
        break;
      }
    }
  }
  return lines[lines.length - 1];
}

function readStreamToStore(
  stream: Readable,
  buffer: string,
): Effect.Effect<string, Error> {
  return Effect.callback<string, Error>((resume) => {
    let localBuffer = buffer;
    let closed = false;

    const onData = (chunk: Uint8Array) => {
      const t = decoder.decode(chunk, { stream: true });
      localBuffer = processStreamChunk(t, localBuffer);
    };

    const onEnd = () => {
      closed = true;
      cleanup();
      resume(Effect.succeed(localBuffer));
    };

    const onError = (err: Error) => {
      closed = true;
      cleanup();
      resume(Effect.fail(err));
    };

    const cleanup = () => {
      stream.removeListener("data", onData);
      stream.removeListener("end", onEnd);
      stream.removeListener("error", onError);
    };

    stream.on("data", onData);
    stream.on("end", onEnd);
    stream.on("error", onError);

    stream.resume();

    return Effect.sync(() => {
      if (!closed) {
        cleanup();
        stream.destroy();
      }
    });
  });
}

export function useStreamChat(serverUrl: string) {
  const toast = useToast();
  const sessionIdRef = useRef<string | undefined>(undefined);
  const statusRef = useRef<"idle" | "streaming">("idle");
  const streamRef = useRef<Readable | null>(null);
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

      assistantMsgAdded = false;
      streamRef.current = null;

      useAppStore.getState().clearThought();
      useAppStore.getState().addUserMessage(text);
      useAppStore.getState().setStreaming(true);
      statusRef.current = "streaming";

      let sessionId = sessionIdRef.current;

      const setStreamingSession = (id: string | undefined) => {
        useAppStore.getState().setStreamingSessionId(id);
      };

      // Wrap the stream lifecycle in an Effect for proper scoped resource management
      const program = Effect.gen(function* () {
        if (!sessionId) {
          dbg.log("fetching config for default model");
          const config = yield* apiFetch<{ defaultModel: string }>(
            CONFIG_PATH,
            {},
            serverUrl,
          ).pipe(
            Effect.catch((cause) =>
              Effect.fail(new Error(`Config fetch failed: ${cause}`)),
            ),
          );
          const m = useAppStore.getState().model ?? config.defaultModel;
          if (!m) {
            throw new Error(
              "No model selected. Use Ctrl+M or /models command to select a model.",
            );
          }
          dbg.log("creating session", { model: m, name: text.slice(0, 60) });
          const session = yield* apiFetch<{ id: string }>(
            SESSIONS_PATH,
            {
              method: "POST",
              body: JSON.stringify({ name: text.slice(0, 60), model: m }),
            },
            serverUrl,
          ).pipe(
            Effect.catch((cause) =>
              Effect.fail(new Error(`Session creation failed: ${cause}`)),
            ),
          );
          sessionId = session.id;
          sessionIdRef.current = sessionId;
          useAppStore.getState().setCurrentSessionId(sessionId);
          toast.show({ variant: "success", message: "Session created" });
          dbg.log("session created", { sessionId });
        }

        setStreamingSession(sessionId);

        const model = useAppStore.getState().model;
        const effortLevel = useAppStore.getState().effortLevel;

        dbg.log("opening stream", { sessionId, model, endpoint: "/chat" });
        const stream = yield* apiFetchStream(
          CHAT_PATH,
          { message: text, model, sessionId, effortLevel },
          serverUrl,
        ).pipe(
          Effect.catch((cause) =>
            Effect.fail(new Error(`Stream open failed: ${cause}`)),
          ),
        );

        streamRef.current = stream;
        dbg.log("stream connected, reading chunks");

        yield* readStreamToStore(stream, "");
        dbg.log("stream finished");

        // Commit thought from global store to the last assistant message
        const afterState = useAppStore.getState();
        if (afterState.thought) {
          afterState.commitThought();
        }
      });

      try {
        await Effect.runPromise(program);
      } catch (err) {
        const errMsg = Effect.runSync(errorMessage(err));
        dbg.error("stream failed", { error: errMsg });
        useAppStore.getState().setLastAssistantError(errMsg);
        toast.show({ variant: "error", message: errMsg });
      } finally {
        dbg.log("stream flow complete, resetting state");
        const stream = streamRef.current;
        if (stream !== null) {
          try {
            (stream as Readable).destroy();
          } catch {}
          streamRef.current = null;
        }
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
