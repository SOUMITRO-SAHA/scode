import * as Effect from "effect/Effect";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";

import { sendPrompt } from "@/services/client";
import { gracefulShutdown } from "@/services/shutdown";

export const runRepl = (
  serverUrl: string,
  model?: string,
): Effect.Effect<void> =>
  Effect.promise(
    () =>
      new Promise<void>((resolve) => {
        console.log("scode REPL — type your prompt, or /q to quit");
        const rl = createInterface({
          input: stdin,
          output: stdout,
          terminal: true,
        });

        rl.on("line", async (line) => {
          const input = line.trim();
          if (!input) {
            rl.prompt();
            return;
          }
          if (input === "/q") {
            rl.close();
            return;
          }
          console.log();
          try {
            await Effect.runPromise(
              sendPrompt(
                input,
                serverUrl,
                (token) => stdout.write(token),
                model,
              ),
            );
          } catch (err) {
            console.error(`\nError: ${(err as Error).message}`);
          }
          console.log("\n");
          rl.prompt();
        });

        rl.on("close", () => {
          resolve();
          void Effect.runPromise(gracefulShutdown(0, serverUrl));
        });

        rl.prompt();
      }),
  );
