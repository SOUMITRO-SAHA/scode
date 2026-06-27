import { Cause, Effect, Stream } from "effect";

import type { ConfigService } from "../config/service";
import { resolveApiKey } from "../llm/config";
import { LLMError, ToolFailure } from "../llm/error";
import type { ProviderService } from "../llm/provider-service";
import { buildPrompt } from "../prompt/builder";
import type { SessionService } from "../session/service";
import type { SkillService } from "../skill/service";
import type { ToolService } from "../tool/service";
import type { StreamEvent } from "../types";

import { DebugLogger, Logger } from "@scode/shared/logger";

const logger = new Logger();
const dbg = new DebugLogger("server:handler");

type StreamWriter = (chunk: string) => void | Promise<unknown>;

type DepsConfig = ConfigService["Service"];
type DepsProvider = ProviderService["Service"];
type DepsSession = SessionService["Service"];
type DepsTool = ToolService["Service"];
type DepsSkill = SkillService["Service"];

export interface HandlerDeps {
  configService: DepsConfig;
  providerService: DepsProvider;
  sessionService: DepsSession;
  toolService: DepsTool;
  skillService: DepsSkill;
}

const runSync: <A>(eff: Effect.Effect<A>) => A = Effect.runSync;

export async function handleChat(
  prompt: string,
  modelStr: string,
  sessionId: string | undefined,
  deps: HandlerDeps,
  streamWriter: StreamWriter,
): Promise<string> {
  const cfg = runSync(deps.configService.get);
  const resolvedModel = modelStr || cfg.defaultModel;

  if (!resolvedModel) {
    throw new Error(
      "No model selected. Use Ctrl+M or /models command to select a model.",
    );
  }

  const { provider, model } = deps.providerService.resolve(resolvedModel);
  const apiKey = resolveApiKey(provider.id);

  dbg.log("chat request received", {
    prompt: prompt.slice(0, 120),
    model: resolvedModel,
    provider: provider.id,
    sessionId,
  });

  logger.info(`Chat with ${provider.id}/${model}: "${prompt.slice(0, 80)}"`);

  let session = runSync(deps.sessionService.get(sessionId ?? ""));
  if (!session) {
    session = runSync(
      deps.sessionService.create(
        prompt.slice(0, 60),
        resolvedModel,
        provider.id,
      ),
    );
  }

  session.messages.push({ role: "user", content: prompt });
  runSync(deps.sessionService.update(session));

  const skills = deps.skillService.loadAllSkills();
  const matched = deps.skillService.matchSkills(prompt, skills);
  const toolDefs = deps.toolService.definitions();
  const { system } = buildPrompt(matched, prompt, toolDefs);

  dbg.log("skills matched", {
    total: skills.length,
    matched: matched.map((s) => s.name),
  });
  dbg.log("tools available", { count: toolDefs.length });

  const conversation = [...session.messages];
  let fullResponse = "";

  for (let i = 0; i < 10; i++) {
    let toolCalled = false;
    dbg.log(`tool loop iteration ${i + 1}/10`);

    let gen: AsyncGenerator<StreamEvent>;
    try {
      gen = provider.streamResponse({
        system,
        messages: conversation,
        tools: toolDefs,
        model,
        apiKey,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      dbg.error("llm init failed", { error: msg });
      logger.error(`LLM init failed for ${provider.id}/${model}: ${msg}`);
      await streamWriter(`\n\n*Error*: LLM call failed - ${msg}`);
      break;
    }

    const stream = Stream.fromAsyncIterable<StreamEvent, Error>(gen, (e) =>
      e instanceof Error ? e : new Error(String(e)),
    ).pipe(
      Stream.catchCause((cause: Cause.Cause<Error>) => {
        const error = cause.reasons.find(Cause.isFailReason)?.error;
        if (error instanceof LLMError) {
          const msg = `${error.module}.${error.method}: ${error.reason.message}`;
          dbg.error("llm stream error", {
            error: msg,
            retryable: error.retryable,
          });
          logger.error(`LLM stream error: ${msg}`);
          return Stream.make({ type: "error" as const, message: msg });
        }
        if (error instanceof ToolFailure) {
          dbg.error("tool failure", { error: error.error });
          return Stream.make({ type: "error" as const, message: error.error });
        }
        if (error instanceof Error) {
          dbg.error("llm stream error", { error: error.message });
          logger.error(`LLM stream error: ${error.message}`);
          return Stream.make({
            type: "error" as const,
            message: error.message,
          });
        }
        const msg = String(error);
        dbg.error("llm stream unhandled error", { error: msg });
        logger.error(`LLM stream unhandled error: ${msg}`);
        return Stream.make({ type: "error" as const, message: msg });
      }),
    );

    let streamChunkCount = 0;
    for await (const event of Stream.toAsyncIterable(stream)) {
      if (event.type === "text") {
        streamChunkCount++;
        fullResponse += event.delta;
        await streamWriter(event.delta);
      } else if (event.type === "tool_use") {
        toolCalled = true;
        dbg.log("tool call", {
          name: event.toolCall.name,
          input: event.toolCall.input,
        });
        logger.info(`Tool call: ${event.toolCall.name}`);

        const result = await Effect.runPromise(
          deps.toolService
            .settle(event.toolCall)
            .pipe(
              Effect.catch((failure: ToolFailure) =>
                Effect.succeed({ error: failure.error }),
              ),
            ),
        );

        dbg.log("tool result", {
          name: event.toolCall.name,
          resultPreview: JSON.stringify(result).slice(0, 200),
        });

        conversation.push({
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: event.toolCall.id,
              name: event.toolCall.name,
              input: event.toolCall.input,
            },
          ],
        });

        if (result && typeof result === "object" && "error" in result) {
          conversation.push({
            role: "tool",
            tool_call_id: event.toolCall.id,
            content: JSON.stringify({
              error: (result as { error: string }).error,
            }),
          });
        } else {
          conversation.push({
            role: "tool",
            tool_call_id: event.toolCall.id,
            content: JSON.stringify(result),
          });
        }
      } else if (event.type === "error") {
        await streamWriter(`\n\n*Error*: ${event.message}`);
      } else if (event.type === "done") {
        break;
      }
    }
    dbg.log("stream event loop done", { streamChunkCount, toolCalled });
    if (!toolCalled) break;
  }

  dbg.log("response complete", {
    responseLength: fullResponse.length,
    preview: fullResponse.slice(0, 200),
  });

  runSync(
    deps.sessionService.addMessage(session.id, {
      role: "assistant",
      content: fullResponse,
    }),
  );

  return session.id;
}
