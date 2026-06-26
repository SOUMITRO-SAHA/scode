import axios, { type AxiosRequestConfig } from "axios";
import { Readable } from "node:stream";

import { apiV1Base } from "../constants/endpoints";

export function apiUrl(path: string, base?: string): string {
  return `${apiV1Base(base)}${path}`;
}

export async function apiFetch<T>(
  path: string,
  opts?: RequestInit,
  base?: string,
): Promise<T> {
  const config: AxiosRequestConfig = {
    method: ((opts?.method as string)?.toLowerCase() ?? "get") as
      | "get"
      | "post"
      | "put"
      | "patch"
      | "delete",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers as Record<string, string>),
    },
    data: opts?.body,
    signal: opts?.signal as AbortSignal,
  };
  const res = await axios(apiUrl(path, base), config);
  return res.data as T;
}

export async function apiFetchStream(
  path: string,
  body: unknown,
  base?: string,
): Promise<Readable> {
  const config: AxiosRequestConfig = {
    method: "post",
    headers: { "Content-Type": "application/json" },
    data: body,
    responseType: "stream",
  };
  const res = await axios(apiUrl(path, base), config);
  return res.data as Readable;
}
