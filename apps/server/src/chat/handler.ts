import type { ConfigManager } from "../config/manager";
import { resolveApiKey } from "../llm/config";
import type { ProviderRegistry } from "../llm/registry";
import { buildPrompt } from "../prompt/builder";
import type { SessionManager } from "../session/manager";
import { discover } from "../skill/discover";
import { loadSkill } from "../skill/loader";
import { matchSkills } from "../skill/matcher";
import type { Registry as ToolRegistry } from "../tool/registry";

import { Logger } from "@scode/shared/logger";

const logger = new Logger();

type StreamWriter = (chunk: string) => void | Promise<unknown>;

export async function handleChat(
  prompt: string,
  modelStr: string,
  sessionId: string | undefined,
  deps: {
    providerRegistry: ProviderRegistry;
    toolRegistry: ToolRegistry;
    sessionManager: SessionManager;
    configManager: ConfigManager;
  },
  streamWriter: StreamWriter,
): Promise<string> {
  const config = deps.configManager.get();
  const resolvedModel = modelStr || config.defaultModel;

  if (!resolvedModel) {
    throw new Error(
      "No model selected. Use Ctrl+M or /models command to select a model.",
    );
  }

  const { provider, model } = deps.providerRegistry.resolve(resolvedModel);
  const apiKey = resolveApiKey(provider.id);

  logger.info(`Chat with ${provider.id}/${model}: "${prompt.slice(0, 80)}"`);

  let session = sessionId ? deps.sessionManager.get(sessionId) : null;
  if (!session) {
    session = deps.sessionManager.create(
      prompt.slice(0, 60),
      resolvedModel,
      provider.id,
    );
  }

  session.messages.push({ role: "user", content: prompt });
  deps.sessionManager.update(session);

  const skillDirs = discover();
  const loaded = skillDirs.map(loadSkill);
  const skills = loaded.filter((s): s is NonNullable<typeof s> => s !== null);

  const matched = matchSkills(prompt, skills);
  const toolDefs = deps.toolRegistry.definitions();
  const { system } = buildPrompt(matched, prompt, toolDefs);

  const conversation = [...session.messages];
  let fullResponse = "";

  for (let i = 0; i < 10; i++) {
    let toolCalled = false;
    const generator = provider.streamResponse({
      system,
      messages: conversation,
      tools: toolDefs,
      model,
      apiKey,
    });

    for await (const event of generator) {
      if (event.type === "text") {
        fullResponse += event.delta;
        await streamWriter(event.delta);
      } else if (event.type === "tool_use") {
        toolCalled = true;
        logger.info(`Tool call: ${event.toolCall.name}`);
        let result: unknown;
        try {
          result = await deps.toolRegistry.settle(event.toolCall);
        } catch (err: unknown) {
          result = { error: err instanceof Error ? err.message : String(err) };
        }

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
        conversation.push({
          role: "tool",
          tool_call_id: event.toolCall.id,
          content: JSON.stringify(result),
        });
      } else if (event.type === "done") {
        break;
      }
    }
    if (!toolCalled) break;
  }

  deps.sessionManager.addMessage(session.id, {
    role: "assistant",
    content: fullResponse,
  });

  return session.id;
}
