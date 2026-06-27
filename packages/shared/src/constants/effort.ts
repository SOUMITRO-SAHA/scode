import type { EffortLevel } from "../types/entities";

export const EFFORT_LEVELS: EffortLevel[] = ["low", "medium", "high"];

export const EFFORT_THINKING_BUDGET: Record<EffortLevel, number | undefined> = {
  none: undefined,
  minimal: 1024,
  low: 2048,
  medium: 8192,
  high: 16384,
  xhigh: 32000,
  max: 64000,
};
