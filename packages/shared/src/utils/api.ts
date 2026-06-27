import axios, { type AxiosRequestConfig } from "axios";
import { Effect } from "effect";
import { Readable } from "node:stream";

import { apiV1Base } from "../constants/endpoints";
import { ApiFetchError, ApiStreamError } from "../effect/errors";

export function apiUrl(path: string, base?: string): string {
  return `${apiV1Base(base)}${path}`;
}

export const apiFetch = Effect.fnUntraced(function* <T>(
  path: string,
  opts?: RequestInit,
  base?: string,
) {
  const url = apiUrl(path, base);
  const method = (opts?.method as string)?.toLowerCase() ?? "get";
  const config: AxiosRequestConfig = {
    method: method as "get" | "post" | "put" | "patch" | "delete",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers as Record<string, string>),
    },
    data: opts?.body,
    signal: opts?.signal as AbortSignal,
  };
  const res = yield* Effect.tryPromise({
    try: () => axios(url, config),
    catch: (err) =>
      new ApiFetchError({
        url,
        method,
        status:
          err instanceof Error && "status" in err
            ? (err as { status: number }).status
            : undefined,
      }),
  });
  return res.data as T;
});

export const apiFetchStream = Effect.fnUntraced(function* (
  path: string,
  body: unknown,
  base?: string,
) {
  const url = apiUrl(path, base);
  const config: AxiosRequestConfig = {
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: body,
    responseType: "stream",
  };
  const res = yield* Effect.tryPromise({
    try: () => axios(url, config),
    catch: (err) =>
      new ApiStreamError({
        url,
        status:
          err instanceof Error && "status" in err
            ? (err as { status: number }).status
            : undefined,
      }),
  });
  return res.data as Readable;
});
