import { Context, Effect, Layer } from "effect";
import { Readable } from "node:stream";

import { apiFetch, apiFetchStream, apiUrl as rawApiUrl } from "../utils/api";
import { generateId } from "../utils/id";
import { formatModelName, parseModelString } from "../utils/model";
import { formatTime as rawFormatTime } from "../utils/time";
import {
  ApiFetchError,
  ApiStreamError,
  ApiUrlError,
  IdGenerationError,
  ModelParseError,
} from "./errors";

export class ApiService extends Context.Service<
  ApiService,
  {
    readonly fetch: <T>(
      path: string,
      opts?: RequestInit,
      base?: string,
    ) => Effect.Effect<T, ApiFetchError>;
    readonly fetchStream: (
      path: string,
      body: unknown,
      base?: string,
    ) => Effect.Effect<Readable, ApiStreamError>;
    readonly url: (
      path: string,
      base?: string,
    ) => Effect.Effect<string, ApiUrlError>;
  }
>()("scode/shared/ApiService") {
  static readonly Live = Layer.succeed(
    ApiService,
    ApiService.of({
      fetch: <T>(path: string, opts?: RequestInit, base?: string) =>
        apiFetch<T>(path, opts, base),
      fetchStream: (path: string, body: unknown, base?: string) =>
        apiFetchStream(path, body, base),
      url: (path: string, base?: string) =>
        Effect.sync(() => {
          try {
            return rawApiUrl(path, base);
          } catch {
            throw new ApiUrlError({ path });
          }
        }),
    }),
  );
}

export class IdService extends Context.Service<
  IdService,
  {
    readonly generate: Effect.Effect<string, IdGenerationError>;
  }
>()("scode/shared/IdService") {
  static readonly Live = Layer.succeed(
    IdService,
    IdService.of({
      generate: generateId,
    }),
  );
}

export class TimeService extends Context.Service<
  TimeService,
  {
    readonly formatTime: (date: Date) => Effect.Effect<string>;
  }
>()("scode/shared/TimeService") {
  static readonly Live = Layer.succeed(
    TimeService,
    TimeService.of({
      formatTime: (date: Date) => rawFormatTime(date),
    }),
  );
}

export class ModelService extends Context.Service<
  ModelService,
  {
    readonly parse: (
      input: string,
    ) => Effect.Effect<{ providerId: string; model: string }, ModelParseError>;
    readonly formatName: (modelId: string) => Effect.Effect<string>;
  }
>()("scode/shared/ModelService") {
  static readonly Live = Layer.succeed(
    ModelService,
    ModelService.of({
      parse: (input: string) => parseModelString(input),
      formatName: (modelId: string) => formatModelName(modelId),
    }),
  );
}
