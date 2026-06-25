import { DEFAULT_PORT, SERVER_HOST } from "./index.js"

export function serverBase(port: number = DEFAULT_PORT): string {
  return `http://${SERVER_HOST}:${port}`
}

export function healthUrl(base?: string): string {
  return `${base ?? serverBase()}/health`
}

export function processUrl(base?: string): string {
  return `${base ?? serverBase()}/process`
}
