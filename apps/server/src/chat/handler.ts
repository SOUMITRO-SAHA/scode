import { Cause, Effect, Stream } from "effect";

import type { ConfigService } from "../config/service";
import { resolveApiKey } from "../llm/config";
import { LLMError } from "../llm/error";
import type { LLMProvider } from "../llm/provider";
import type { ProviderService } from "../llm/provider-service";
import { buildPrompt } from "../prompt/builder";
import type { Session } from "../session/manager";
import type { SessionService } from "../session/service";
import type { SkillService } from "../skill/service";
import type { ToolService } from "../tool/service";
import { constrainedDefinition } from "../tool/skill";
import type { Skill, StreamEvent } from "../types";

import { MAX_TOOL_ITERATIONS } from "@scode/shared/constants";
import { ToolFailure } from "@scode/shared/effect";
import { Logger } from "@scode/shared/logger";
import { encodeStreamChunk } from "@scode/shared/types";
import type { EffortLevel } from "@scode/shared/types";
import { truncate } from "@scode/shared/utils";

const logger = new Logger();

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

const errorMsg = (msg: string) => `[Error: ${msg}]`;

function persistError(
  deps: HandlerDeps,
  sessionId: string,
  msg: string,
): Effect.Effect<void> {
  return Effect.as(
    deps.sessionService.addMessage(sessionId, {
      role: "system" as const,
      content: errorMsg(msg),
    }),
    void 0,
  );
}

function extractErrorMsg(
  error: unknown,
  providerId: string,
  model: string,
): string {
  if (error instanceof LLMError) {
    const msg = `${error.module}.${error.method}: ${error.reason.message}`;
    logger.error(`LLM stream error: ${msg}`);
    return msg;
  }
  if (error instanceof ToolFailure) {
    return error.error;
  }
  if (error instanceof Error) {
    logger.error(`LLM stream error: ${error.message}`);
    return error.message;
  }
  const msg = String(error);
  logger.error(`LLM stream unhandled error: ${msg}`);
  return msg;
}

function extractCauseMsg(
  cause: Cause.Cause<Error>,
  providerId: string,
  model: string,
): string {
  const error = cause.reasons?.find(Cause.isFailReason)?.error;
  return extractErrorMsg(error, providerId, model);
}

export async function handleChat(
  prompt: string,
  modelStr: string,
  sessionId: string | undefined,
  deps: HandlerDeps,
  streamWriter: StreamWriter,
  effortLevel?: EffortLevel,
): Promise<string> {
  const cfg = Effect.runSync(deps.configService.get);
  const resolvedModel = modelStr || cfg.defaultModel;

  if (!resolvedModel) {
    throw new Error(
      "No model selected. Use Ctrl+M or /models command to select a model.",
    );
  }

  const { provider, model } = deps.providerService.resolve(resolvedModel);
  const apiKey = resolveApiKey(provider.id);

  logger.info(
    `Chat with ${provider.id}/${model}: "${Effect.runSync(truncate(prompt, 80))}"`,
  );

  let session = Effect.runSync(deps.sessionService.get(sessionId ?? ""));
  if (!session) {
    session = Effect.runSync(
      deps.sessionService.create(
        Effect.runSync(truncate(prompt, 60)),
        resolvedModel,
        provider.id,
      ),
    );
  }

  // Emit meta chunk so CLI knows the session ID immediately
  await streamWriter(
    encodeStreamChunk({
      type: "meta",
      sessionId: session.id,
      model: resolvedModel,
    }),
  );

  session.messages.push({ role: "user", content: prompt });
  Effect.runSync(deps.sessionService.update(session));

  // AI auto-rename on 2nd user message (fire-and-forget, non-blocking)
  Effect.runPromise(
    autoRenameSession(deps, session, resolvedModel, apiKey),
  ).catch(() => {});

  const saveSync = (msg: string) =>
    Effect.runSync(persistError(deps, session.id, msg));

  const skills = Effect.runSync(
    Effect.orElseSucceed(deps.skillService.loadAllSkills, () => [] as Skill[]),
  );
  const matched = deps.skillService.matchSkills(prompt, skills);
  const skillNames = skills.map((s) => s.name);
  const toolDefs = deps.toolService
    .definitions()
    .map((def) =>
      def.name === "skill" ? constrainedDefinition(skillNames) : def,
    );
  const { system } = buildPrompt(matched, prompt, toolDefs);

  const conversation = [...session.messages];
  let fullResponse = "";
  let hadError = false;
  let thoughtText = "";
  let lastErrorMessage = "";

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    let toolCalled = false;

    let gen: AsyncGenerator<StreamEvent>;
    try {
      gen = provider.streamResponse({
        system,
        messages: conversation,
        tools: toolDefs,
        model,
        apiKey,
        effortLevel,
      });
    } catch (err: unknown) {
      const msg = extractErrorMsg(err, provider.id, model);
      const errText = `LLM call failed - ${msg}`;
      lastErrorMessage = errText;
      await streamWriter(
        encodeStreamChunk({ type: "error", message: errText }),
      );
      saveSync(errText);
      hadError = true;
      break;
    }

    const stream = Stream.fromAsyncIterable<StreamEvent, Error>(gen, (e) =>
      e instanceof Error ? e : new Error(String(e)),
    ).pipe(
      Stream.catchCause((cause: Cause.Cause<Error>) => {
        const msg = extractCauseMsg(cause, provider.id, model);
        return Stream.fromEffect(
          Effect.as(persistError(deps, session.id, msg), {
            type: "error" as const,
            message: msg,
          }),
        );
      }),
    );

    let streamChunkCount = 0;
    for await (const event of Stream.toAsyncIterable(stream)) {
      if (event.type === "text") {
        streamChunkCount++;
        fullResponse += event.delta;
        await streamWriter(
          encodeStreamChunk({ type: "text", delta: event.delta }),
        );
      } else if (event.type === "thought") {
        thoughtText += event.text;
        await streamWriter(
          encodeStreamChunk({ type: "thought", text: event.text }),
        );
      } else if (event.type === "error") {
        hadError = true;
        lastErrorMessage = event.message;
        await streamWriter(
          encodeStreamChunk({ type: "error", message: event.message }),
        );
      } else if (event.type === "tool_use") {
        toolCalled = true;
        logger.info(`Tool call: ${event.toolCall.name}`);

        // Forward tool_use to client before executing
        await streamWriter(
          encodeStreamChunk({
            type: "tool_use",
            toolCall: event.toolCall,
          }),
        );

        const result = await Effect.runPromise(
          deps.toolService
            .settle(event.toolCall)
            .pipe(
              Effect.catchTag("ToolFailure", (failure: ToolFailure) =>
                Effect.succeed({ error: failure.error }),
              ),
            ),
        );

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
        session.messages.push({
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
          const errMsg = (result as { error: string }).error;
          const toolResultError = {
            role: "tool" as const,
            tool_call_id: event.toolCall.id,
            content: JSON.stringify({ error: errMsg }),
          };
          conversation.push(toolResultError);
          session.messages.push(toolResultError);
          // Forward tool_result to client
          await streamWriter(
            encodeStreamChunk({
              type: "tool_result",
              toolUseId: event.toolCall.id,
              name: event.toolCall.name,
              result: errMsg,
              isError: true,
            }),
          );
          saveSync(errMsg);
          hadError = true;
        } else {
          const resultStr = JSON.stringify(result);
          const toolResultSuccess = {
            role: "tool" as const,
            tool_call_id: event.toolCall.id,
            content: resultStr,
          };
          conversation.push(toolResultSuccess);
          session.messages.push(toolResultSuccess);
          // Forward tool_result to client
          await streamWriter(
            encodeStreamChunk({
              type: "tool_result",
              toolUseId: event.toolCall.id,
              name: event.toolCall.name,
              result: resultStr,
            }),
          );
        }
      } else if (event.type === "done") {
        break;
      }
    }
    if (!toolCalled) break;
  }

  if (fullResponse || hadError || thoughtText) {
    const content =
      hadError && !fullResponse ? `Error: ${lastErrorMessage}` : fullResponse;
    session.messages.push({
      role: "assistant",
      content,
      ...(thoughtText ? { thought: thoughtText } : {}),
    });
    Effect.runSync(deps.sessionService.update(session));
  }

  return session.id;
}

async function generateTitleText(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  firstUserText: string,
  assistantText: string,
): Promise<string | null> {
  try {
    const gen = provider.streamResponse({
      system:
        "You generate short conversation titles. Respond with ONLY the title, max 60 characters, no quotes, no punctuation, no explanation.",
      messages: [
        {
          role: "user",
          content: `Generate a title for this conversation:\n\nUser: ${firstUserText.slice(0, 500)}\n\nAssistant: ${assistantText.slice(0, 500)}`,
        },
      ],
      tools: [],
      model,
      apiKey,
    });

    let text = "";
    for await (const event of gen) {
      if (event.type === "text") text += event.delta;
      if (event.type === "error") return null;
    }

    const cleaned = text
      .replace(/<think>[\s\S]*?<\/think>\s*/g, "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);

    if (!cleaned) return null;
    return cleaned.length > 100 ? cleaned.substring(0, 97) + "..." : cleaned;
  } catch {
    return null;
  }
}

const autoRenameSession = Effect.fnUntraced(function* (
  deps: HandlerDeps,
  session: Session,
  resolvedModel: string,
  apiKey: string,
) {
  const userMessages = session.messages.filter((m) => m.role === "user");
  const assistantMessages = session.messages.filter(
    (m) => m.role === "assistant",
  );

  if (userMessages.length !== 2) return;
  if (assistantMessages.length < 1) return;

  const firstText =
    typeof userMessages[0].content === "string" ? userMessages[0].content : "";
  const textAssistant = assistantMessages.find(
    (m) => typeof m.content === "string" && m.content.length > 0,
  );
  if (!firstText || !textAssistant) return;
  const assistantText =
    typeof textAssistant.content === "string" ? textAssistant.content : "";
  if (!assistantText) return;

  const { provider, model } = deps.providerService.resolve(resolvedModel);

  const title = yield* Effect.promise(() =>
    generateTitleText(provider, apiKey, model, firstText, assistantText),
  );
  if (!title || title === session.name) return;

  session.name = title;
  yield* deps.sessionService.update(session);
});
