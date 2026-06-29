import { Layer, ManagedRuntime } from "effect";

import { ConfigServiceLive } from "../config/service";
import { ProviderServiceLive } from "../llm/provider-service";
import { ActiveClientServiceLive } from "../session/active-clients-service";
import { SessionServiceLive } from "../session/service";
import { SkillServiceLive } from "../skill/service";
import { ToolServiceLive } from "../tool/service";
import { WorkspaceServiceLive } from "../tool/workspace";
import { LoggerServiceLive } from "./logger";

export const AppLayer = Layer.mergeAll(
  ConfigServiceLive,
  SessionServiceLive,
  ProviderServiceLive,
  ToolServiceLive,
  SkillServiceLive,
  ActiveClientServiceLive,
  WorkspaceServiceLive,
  LoggerServiceLive,
);

export const runtime = ManagedRuntime.make(AppLayer);
