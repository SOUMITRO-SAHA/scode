import type { StreamEvent, ToolDefinition } from "../types";
import type { UnifiedMessage } from "./types";

import type { EffortLevel } from "@scode/shared/types";

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultModel: string;

  listModels?(apiKey: string): Promise<string[]>;

  streamResponse(params: {
    system: string;
    messages: UnifiedMessage[];
    tools: ToolDefinition[];
    model?: string;
    apiKey: string;
    effortLevel?: EffortLevel;
  }): AsyncGenerator<StreamEvent>;
}
