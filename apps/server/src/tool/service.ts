import { Context, Effect, Layer } from "effect";

import type { ToolCall, ToolDefinition } from "../types";
import { allTools } from "./make";
import { ToolRegistry } from "./registry";

import { ToolFailure } from "@scode/shared/effect";

export class ToolService extends Context.Service<
  ToolService,
  {
    readonly definitions: () => ToolDefinition[];
    readonly settle: (call: ToolCall) => Effect.Effect<unknown, ToolFailure>;
  }
>()("ToolService") {}

function buildToolRegistry(): ToolRegistry {
  const reg = new ToolRegistry();
  for (const t of allTools) {
    reg.register(t);
  }
  return reg;
}

const toolRegistry = buildToolRegistry();

export const ToolServiceLive = Layer.succeed(
  ToolService,
  ToolService.of({
    definitions: () => toolRegistry.definitions(),
    settle: (call) => toolRegistry.settle(call),
  }),
);
