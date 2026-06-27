import axios, { type AxiosRequestConfig } from "axios";
import { Readable } from "node:stream";

import { apiV1Base } from "../constants/endpoints";
import { DebugLogger } from "../logger/debug";

const dbg = new DebugLogger("shared:api");

export function apiUrl(path: string, base?: string): string {
  return `${apiV1Base(base)}${path}`;
}

export async function apiFetch<T>(
  path: string,
  opts?: RequestInit,
  base?: string,
): Promise<T> {
  const url = apiUrl(path, base);
  const method = (opts?.method as string)?.toLowerCase() ?? "get";
  dbg.log("apiFetch", { method, url });
  const config: AxiosRequestConfig = {
    method: method as "get" | "post" | "put" | "patch" | "delete",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers as Record<string, string>),
    },
    data: opts?.body,
    signal: opts?.signal as AbortSignal,
  };
  try {
    const res = await axios(url, config);
    dbg.log("apiFetch ok", { method, url, status: res.status });
    return res.data as T;
  } catch (err) {
    dbg.error("apiFetch failed", {
      method,
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function apiFetchStream(
  path: string,
  body: unknown,
  base?: string,
): Promise<Readable> {
  const url = apiUrl(path, base);
  dbg.log("apiFetchStream", { url, body });
  const config: AxiosRequestConfig = {
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: body,
    responseType: "stream",
  };
  try {
    const res = await axios(url, config);
    dbg.log("apiFetchStream connected", { url, status: res.status });
    return res.data as Readable;
  } catch (err) {
    dbg.error("apiFetchStream failed", {
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
