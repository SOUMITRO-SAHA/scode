import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { Effect } from "effect";
import { Readable } from "node:stream";

import { apiV1Base } from "../constants/endpoints";
import { ApiFetchError, ApiStreamError } from "../effect/errors";
import { getCwd } from "./cwd";

export function apiUrl(path: string, base?: string): string {
  return `${apiV1Base(base)}${path}`;
}

const apiConfig: AxiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

apiConfig.interceptors.request.use((config) => {
  config.headers.set("X-CWD", getCwd());
  return config;
});

export const apiFetch = Effect.fnUntraced(function* <T>(
  path: string,
  opts?: RequestInit,
  base?: string,
) {
  const url = apiUrl(path, base);
  const method = (opts?.method as string)?.toLowerCase() ?? "get";
  const config: AxiosRequestConfig = {
    method: method as "get" | "post" | "put" | "patch" | "delete",
    headers: opts?.headers as Record<string, string>,
    data: opts?.body,
    signal: opts?.signal as AbortSignal,
  };
  const res = yield* Effect.tryPromise({
    try: () => apiConfig(url, config),
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
    data: body,
    responseType: "stream",
    validateStatus: () => true,
  };
  const res = yield* Effect.tryPromise({
    try: () => apiConfig(url, config),
    catch: (err) =>
      new ApiStreamError({
        url,
        status:
          err instanceof Error && "status" in err
            ? (err as { status: number }).status
            : undefined,
      }),
  });
  if (res.status >= 400) {
    const errorBody = yield* Effect.tryPromise({
      try: () => {
        const stream = res.data as Readable;
        return new Promise<string>((resolve) => {
          if (typeof stream?.on !== "function") {
            resolve("");
            return;
          }
          const chunks: Buffer[] = [];
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolve(Buffer.concat(chunks).toString("utf-8"));
          };
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          stream.on("end", finish);
          stream.on("error", () => resolve(""));
          stream.resume?.();
          setTimeout(() => {
            if (!settled) resolve("");
          }, 2000);
        });
      },
      catch: () => new ApiStreamError({ url, status: res.status }),
    });
    yield* Effect.fail(
      new ApiStreamError({ url, status: res.status, body: errorBody }),
    );
  }
  return res.data as Readable;
});
