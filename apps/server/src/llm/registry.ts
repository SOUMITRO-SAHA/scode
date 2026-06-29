import { Effect } from "effect";

import type { LLMProvider } from "./provider";

import { parseModelString } from "@scode/shared/utils";

export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  parseModelString(input: string): { providerId: string; model: string } {
    const parsed = Effect.runSync(parseModelString(input));
    return parsed;
  }

  resolve(input: string): { provider: LLMProvider; model: string } {
    const { providerId, model } = this.parseModelString(input);
    if (providerId) {
      const provider = this.providers.get(providerId);
      if (!provider)
        throw new Error(
          `Unknown provider: "${providerId}" (available: ${[...this.providers.keys()].join(", ")})`,
        );
      return { provider, model };
    }
    const provider = this.providers.values().next().value;
    if (!provider) throw new Error("No providers registered");
    return { provider, model };
  }

  listProviders(): LLMProvider[] {
    return [...this.providers.values()];
  }
}
