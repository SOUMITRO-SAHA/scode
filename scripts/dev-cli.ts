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

  child.on("exit", (code) => {
    if (!restarting) {
      process.exit(code ?? 0);
    }
  });
}

function restartCli() {
  if (restarting) return;
  restarting = true;
  console.log("\x1b[33m[dev] File change detected, restarting...\x1b[0m");
  child?.kill();
  child = null;
  restarting = false;
  startCli();
}

startCli();

watch(srcDir, { recursive: true }, (_event, filename) => {
  if ((filename && filename.endsWith(".tsx")) || filename?.endsWith(".ts")) {
    restartCli();
  }
});

console.log(`\x1b[36m[dev] Watching ${srcDir} for changes...\x1b[0m`);
