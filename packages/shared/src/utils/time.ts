import { Effect } from "effect";

export const formatTime = Effect.fnUntraced(function* (date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${period}`;
});

export const dateFromFilename = Effect.fnUntraced(function* (name: string) {
  const match = name.match(/scode(?:\.(\d{4}-\d{2}-\d{2}))?/);
  if (!match) yield* Effect.fail(new Error("No match"));
  const dateStr = match![1];
  if (!dateStr) yield* Effect.fail(new Error("No date"));
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) yield* Effect.fail(new Error("Invalid date"));
  return d;
});

export const daysOld = Effect.fnUntraced(function* (date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
});
