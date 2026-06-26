import type { LLMProvider } from "./provider";

export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  parseModelString(input: string): { providerId: string; model: string } {
    const idx = input.indexOf("/");
    if (idx === -1)
      throw new Error(
        `Invalid model string: "${input}" (expected format: provider/model)`,
      );
    const providerId = input.slice(0, idx);
    const model = input.slice(idx + 1);
    if (!providerId || !model)
      throw new Error(`Invalid model string: "${input}"`);
    return { providerId, model };
  }

  resolve(input: string): { provider: LLMProvider; model: string } {
    const { providerId, model } = this.parseModelString(input);
    const provider = this.providers.get(providerId);
    if (!provider)
      throw new Error(
        `Unknown provider: "${providerId}" (available: ${[...this.providers.keys()].join(", ")})`,
      );
    return { provider, model };
  }

  listProviders(): LLMProvider[] {
    return [...this.providers.values()];
  }
}
