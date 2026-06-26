import { apiV1Base } from "../constants/endpoints";

export function apiUrl(path: string, base?: string): string {
  return `${apiV1Base(base)}${path}`;
}

export async function apiFetch<T>(
  path: string,
  opts?: RequestInit,
  base?: string,
): Promise<T> {
  const res = await fetch(apiUrl(path, base), {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}
