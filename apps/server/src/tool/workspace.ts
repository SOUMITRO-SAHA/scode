import { Context, Effect, Layer } from "effect";
import { AsyncLocalStorage } from "node:async_hooks";
import { realpathSync } from "node:fs";
import { relative, resolve } from "node:path";

export const workspaceStorage = new AsyncLocalStorage<string>();

export function getWorkspace(): string {
  return workspaceStorage.getStore() ?? realpathSync(process.cwd());
}

export function safeResolve(inputPath: string): string {
  const workspace = getWorkspace();
  const resolved = resolve(workspace, inputPath);
  const rel = relative(workspace, resolved);
  if (rel && rel.startsWith("..")) {
    throw new Error("Path escapes workspace");
  }
  return resolved;
}

export class WorkspaceService extends Context.Service<
  WorkspaceService,
  {
    readonly getWorkspace: Effect.Effect<string>;
    readonly runWithWorkspace: <A>(
      cwd: string,
      fn: () => Promise<A>,
    ) => Effect.Effect<A>;
  }
>()("WorkspaceService") {}

export const WorkspaceServiceLive = Layer.succeed(
  WorkspaceService,
  WorkspaceService.of({
    getWorkspace: Effect.sync(() => getWorkspace()),
    runWithWorkspace: (cwd, fn) =>
      Effect.promise(() => workspaceStorage.run(cwd, fn)),
  }),
);
