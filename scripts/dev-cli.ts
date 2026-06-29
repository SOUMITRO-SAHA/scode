import { type ChildProcess, spawn } from "node:child_process";
import { watch } from "node:fs";

const srcDir = "apps/cli/src";
const cliEntry = "apps/cli/src/index.tsx";
const extraArgs = process.argv.slice(2);

let child: ChildProcess | null = null;
let restarting = false;

function startCli() {
  child = spawn("bun", [cliEntry, ...extraArgs], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (err) => {
    console.error(`\x1b[31m[dev] Failed to start CLI: ${err.message}\x1b[0m`);
    if (!restarting) process.exit(1);
  });

  child.on("exit", (code) => {
    if (!restarting) {
      process.exit(code ?? 0);
    }
  });
}

function restartCli() {
  if (restarting) return;
  restarting = true;
  child?.kill();
  child = null;
  restarting = false;
  startCli();
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

watch(srcDir, { recursive: true }, (_event, filename) => {
  if ((filename && filename.endsWith(".tsx")) || filename?.endsWith(".ts")) {
    restartCli();
  }
});
