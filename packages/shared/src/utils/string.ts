import { Effect } from "effect";

export const truncate = Effect.fnUntraced(function* (
  str: string,
  maxLen: number,
) {
  return str.length <= maxLen ? str : str.slice(0, maxLen);
});

export const splitLines = Effect.fnUntraced(function* (text: string) {
  return text.split("\n").filter(Boolean);
});

export const serializeContent = Effect.fnUntraced(function* (
  content: string | object,
) {
  return typeof content === "string" ? content : JSON.stringify(content);
});
