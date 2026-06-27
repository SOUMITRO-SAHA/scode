import { Effect } from "effect";
import { v4 as uuidv4 } from "uuid";

export const generateId: Effect.Effect<string> = Effect.sync(() => uuidv4());
