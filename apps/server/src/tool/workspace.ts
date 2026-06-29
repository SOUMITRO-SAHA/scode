import { Context, Effect, Layer } from "effect";
import { AsyncLocalStorage } from "node:async_hooks";
import { realpathSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

export const workspaceStorage = new AsyncLocalStorage<string>();

export function getWorkspace(): string {
  return workspaceStorage.getStore() ?? realpathSync(process.cwd());
}

function tryRealpath(p: string): string | null {
  try {
    return realpathSync(p);
  } catch {
    return null;
  }
}

function contains(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return !rel || !rel.startsWith("..");
}

export function safeResolve(inputPath: string): string {
  const workspace = getWorkspace();
  const resolved = resolve(workspace, inputPath);

  // 1. Lexical containment check
  if (!contains(workspace, resolved)) {
    throw new Error("Path escapes workspace");
  }

  // 2. Symlink-aware containment check
  const realTarget = tryRealpath(resolved) ?? tryRealpath(dirname(resolved));
  const realWorkspace = tryRealpath(workspace);
  if (realTarget && realWorkspace && !contains(realWorkspace, realTarget)) {
    throw new Error("Path escapes workspace via symlink");
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
