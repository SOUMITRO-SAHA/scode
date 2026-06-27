import { Layer } from "effect";

import { LoggerService } from "../logger/service";
import { ApiService, IdService, ModelService, TimeService } from "./services";

export const SharedServicesLive = Layer.mergeAll(
  ApiService.Live,
  IdService.Live,
  TimeService.Live,
  ModelService.Live,
);

export const SharedServicesWithLogger = (opts?: {
  logDir?: string;
  level?: "debug" | "info" | "warn" | "error";
  stderr?: boolean;
}) =>
  Layer.mergeAll(
    ApiService.Live,
    IdService.Live,
    TimeService.Live,
    ModelService.Live,
    LoggerService.Live(opts),
  );
