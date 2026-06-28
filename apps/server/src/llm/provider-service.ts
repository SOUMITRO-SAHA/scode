import { Context, Effect, Layer } from "effect";

import { ClaudeAdapter } from "./claude/adapter";
import { CommandCodeAdapter } from "./commandcode/adapter";
import { GeminiAdapter } from "./gemini/adapter";
import { OpenAICompatAdapter } from "./openai-compat/adapter";
import type { LLMProvider } from "./provider";
import { ProviderRegistry } from "./registry";

export class ProviderService extends Context.Service<
  ProviderService,
  {
    readonly getProvider: (id: string) => LLMProvider | undefined;
    readonly resolve: (input: string) => {
      provider: LLMProvider;
      model: string;
    };
    readonly listProviders: () => LLMProvider[];
    readonly parseModelString: (input: string) => {
      providerId: string;
      model: string;
    };
  }
>()("ProviderService") {}

function buildProviderRegistry(): ProviderRegistry {
  const reg = new ProviderRegistry();
  reg.register(new ClaudeAdapter());
  reg.register(new GeminiAdapter());
  reg.register(
    new OpenAICompatAdapter({
      id: "deepseek",
      name: "DeepSeek",
      defaultModel: "deepseek-chat",
      baseURL: "https://api.deepseek.com/v1",
    }),
  );
  reg.register(
    new OpenAICompatAdapter({
      id: "zai",
      name: "Z.ai (Zhipu)",
      defaultModel: "glm-5",
      baseURL: "https://api.z.ai/api/paas/v4/",
    }),
  );
  reg.register(
    new OpenAICompatAdapter({
      id: "minimax",
      name: "MiniMax",
      defaultModel: "minimax-m3",
      baseURL: "https://api.minimax.chat/v1",
    }),
  );
  reg.register(new CommandCodeAdapter());
  return reg;
}

const providerRegistry = buildProviderRegistry();

export const ProviderServiceLive = Layer.succeed(
  ProviderService,
  ProviderService.of({
    getProvider: (id) => providerRegistry.getProvider(id),
    resolve: (input) => providerRegistry.resolve(input),
    listProviders: () => providerRegistry.listProviders(),
    parseModelString: (input) => providerRegistry.parseModelString(input),
  }),
);
