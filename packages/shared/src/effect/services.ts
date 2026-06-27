import { Context, Effect, Layer, Option } from "effect";
import { Readable } from "node:stream";

import {
  apiFetch as rawApiFetch,
  apiFetchStream as rawApiFetchStream,
  apiUrl as rawApiUrl,
} from "../utils/api";
import { generateId as rawGenerateId } from "../utils/id";
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
      fetch: <T>(
        path: string,
        opts?: RequestInit,
        base?: string,
      ): Effect.Effect<T, ApiFetchError> =>
        Effect.tryPromise({
          try: () => rawApiFetch<T>(path, opts, base),
          catch: (err) =>
            new ApiFetchError({
              url: rawApiUrl(path, base),
              method: opts?.method?.toString() ?? "get",
              status:
                err instanceof Error && "status" in err
                  ? (err as { status: number }).status
                  : undefined,
            }),
        }),
      fetchStream: (
        path: string,
        body: unknown,
        base?: string,
      ): Effect.Effect<Readable, ApiStreamError> =>
        Effect.tryPromise({
          try: () => rawApiFetchStream(path, body, base),
          catch: (err) =>
            new ApiStreamError({
              url: rawApiUrl(path, base),
              status:
                err instanceof Error && "status" in err
                  ? (err as { status: number }).status
                  : undefined,
            }),
        }),
      url: (path: string, base?: string): Effect.Effect<string, ApiUrlError> =>
        Effect.sync(() => {
          try {
            return rawApiUrl(path, base);
          } catch (err) {
            throw new ApiUrlError({
              path,
            });
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
      generate: Effect.sync(() => rawGenerateId()),
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
      formatTime: (date: Date) => Effect.sync(() => rawFormatTime(date)),
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
      parse: (input: string) =>
        Effect.fromOption(Option.fromNullOr(parseModelString(input))).pipe(
          Effect.mapError(() => new ModelParseError({ input })),
        ),
      formatName: (modelId: string) =>
        Effect.sync(() => formatModelName(modelId)),
    }),
  );
}
