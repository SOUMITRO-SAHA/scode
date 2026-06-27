import { Effect } from "effect";

export const errorMessage = Effect.fnUntraced(function* (err: unknown) {
  return err instanceof Error ? err.message : String(err);
});
