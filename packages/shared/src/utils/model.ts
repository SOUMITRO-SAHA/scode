import { Effect } from "effect";

import { ModelParseError } from "../effect/errors";

export const parseModelString = Effect.fnUntraced(function* (input: string) {
  const idx = input.indexOf("/");
  if (idx === -1) yield* Effect.fail(new ModelParseError({ input }));
  const providerId = input.slice(0, idx);
  const model = input.slice(idx + 1);
  if (!providerId || !model) yield* Effect.fail(new ModelParseError({ input }));
  return { providerId, model };
});

export const formatModelName = Effect.fnUntraced(function* (modelId: string) {
  return modelId
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
});
