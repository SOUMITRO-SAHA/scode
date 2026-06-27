import { Readable } from "node:stream";

import { Logger } from "@scode/shared/logger";
import { decodeStreamChunk } from "@scode/shared/types";
import type { EffortLevel } from "@scode/shared/types";
import { apiFetchStream } from "@scode/shared/utils";

const logger = new Logger({ stderr: true });

export async function sendPrompt(
  prompt: string,
  serverUrl: string,
  onToken: (token: string) => void,
  model?: string,
  effortLevel?: EffortLevel,
): Promise<string> {
  logger.debug(`Sending prompt to ${serverUrl} (${prompt.slice(0, 60)}...)`);

  const startTime = Date.now();
  const body: Record<string, unknown> = { prompt };
  if (model) body.model = model;
  if (effortLevel) body.effortLevel = effortLevel;

  const stream = await apiFetchStream("/process", body, serverUrl);
  const decoder = new TextDecoder();
  let full = "";
  const buffer: string[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let lineBuf = "";

  function flush() {
    if (buffer.length > 0) {
      const chunk = buffer.join("");
      buffer.length = 0;
      onToken(chunk);
    }
    flushTimer = null;
  }

  function processText(text: string) {
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
  }

  try {
    for await (const chunk of stream as Readable) {
      const text = decoder.decode(chunk as Uint8Array, { stream: true });
      processText(text);

      if (!flushTimer) {
        flushTimer = setTimeout(flush, 0);
      }
    }
  } finally {
    (stream as Readable).destroy();
  }

  if (flushTimer) clearTimeout(flushTimer);
  flush();

  const elapsed = Date.now() - startTime;
  logger.info(`Response complete (${full.length} chars in ${elapsed}ms)`);

  return full;
}
