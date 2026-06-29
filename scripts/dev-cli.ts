import { type ChildProcess, spawn } from "node:child_process";

const cliEntry = "apps/cli/src/index.tsx";
const extraArgs = process.argv.slice(2);

let child: ChildProcess | null = null;

function startCli() {
  child = spawn("bun", [cliEntry, ...extraArgs], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (err) => {
    console.error(`\x1b[31m[dev] Failed to start CLI: ${err.message}\x1b[0m`);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

function cleanup() {
  if (child && !child.killed) child.kill();
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

startCli();
