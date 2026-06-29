import * as Effect from "effect/Effect";
import { Readable } from "node:stream";

import { StreamError } from "./errors";
import { getClientId } from "./shutdown";

import { PROCESS_PATH } from "@scode/shared/constants";
import { Logger } from "@scode/shared/logger";
import { decodeStreamChunk } from "@scode/shared/types";
import type { EffortLevel } from "@scode/shared/types";
import { apiFetchStream, truncate } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });

export const sendPrompt = (
  prompt: string,
  serverUrl: string,
  onToken: (token: string) => void,
  model?: string,
  effortLevel?: EffortLevel,
): Effect.Effect<string, StreamError> =>
  Effect.gen(function* () {
    const startTime = Date.now();

    const body: Record<string, unknown> = {
      prompt,
      clientId: getClientId() ?? undefined,
    };
    if (model) body.model = model;
    if (effortLevel) body.effortLevel = effortLevel;

    const stream = yield* apiFetchStream(PROCESS_PATH, body, serverUrl).pipe(
      Effect.catch((cause) =>
        Effect.fail(
          new StreamError({ message: "Failed to open stream", cause }),
        ),
      ),
    );

    const decoder = new TextDecoder();
    let full = "";
    const buffer: string[] = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let lineBuf = "";

    const flush = () => {
      if (buffer.length > 0) {
        const chunk = buffer.join("");
        buffer.length = 0;
        onToken(chunk);
      }
      flushTimer = null;
    };

    const processText = (text: string) => {
      lineBuf += text;
      const lines = lineBuf.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parsed = decodeStreamChunk(line);
        if (!parsed) {
          full += line;
          buffer.push(line);
          continue;
        }
        if (parsed.type === "text") {
          full += parsed.delta;
          buffer.push(parsed.delta);
        }
      }
      lineBuf = lines[lines.length - 1];
    };

    yield* Effect.callback<void, StreamError>((resume) => {
      let closed = false;

      const onData = (chunk: Uint8Array) => {
        const text = decoder.decode(chunk, { stream: true });
        processText(text);
        if (!flushTimer) {
          flushTimer = setTimeout(flush, 0);
        }
      };

      const onEnd = () => {
        closed = true;
        cleanup();
        if (flushTimer) clearTimeout(flushTimer);
        flush();
        resume(Effect.succeed(undefined));
      };

      const onError = (err: Error) => {
        closed = true;
        cleanup();
        resume(
          Effect.fail(
            new StreamError({ message: "Stream read error", cause: err }),
          ),
        );
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

    const elapsed = Date.now() - startTime;
    logger.info(`Response complete (${full.length} chars in ${elapsed}ms)`);

    return full;
  });
