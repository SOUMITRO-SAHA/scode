import { Context, Effect, Layer } from "effect";

import { ToolFailure } from "../llm/error";
import type { ToolCall, ToolDefinition } from "../types";
import * as bashTool from "./bash";
import * as editTool from "./edit";
import * as globTool from "./glob";
import * as grepTool from "./grep";
import * as readTool from "./read";
import { ToolRegistry } from "./registry";
import * as writeTool from "./write";

export class ToolService extends Context.Service<
  ToolService,
  {
    readonly definitions: () => ToolDefinition[];
    readonly settle: (call: ToolCall) => Effect.Effect<unknown, ToolFailure>;
  }
>()("ToolService") {}

function buildToolRegistry(): ToolRegistry {
  const reg = new ToolRegistry();
  reg.register("read", readTool.definition, readTool.handler);
  reg.register("write", writeTool.definition, writeTool.handler);
  reg.register("edit", editTool.definition, editTool.handler);
  reg.register("bash", bashTool.definition, bashTool.handler);
  reg.register("grep", grepTool.definition, grepTool.handler);
  reg.register("glob", globTool.definition, globTool.handler);
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
