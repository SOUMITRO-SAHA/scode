export const breakpoints = {
  sm: 80,
  md: 100,
  lg: 120,
} as const;

export const sidebar = {
  width: 30,
} as const;

export const content = {
  maxWidth: 120,
  minWidth: 60,
  promptMaxWidth: 80,
} as const;

export const composer = {
  linesByHeight: {
    compact: 1,
    normal: 2,
    spacious: 3,
  },
  heightThresholds: {
    compact: 20,
    normal: 28,
  },
} as const;

export const layout = {
  breakpoints,
  sidebar,
  content,
  composer,
} as const;

export type Breakpoint = keyof typeof breakpoints;
export type Layout = typeof layout;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  return "sm";
}

export function isWide(width: number): boolean {
  return width >= breakpoints.lg;
}

export function getComposerLines(height: number): number {
  if (height < composer.heightThresholds.compact) return composer.linesByHeight.compact;
  if (height < composer.heightThresholds.normal) return composer.linesByHeight.normal;
  return composer.linesByHeight.spacious;
}
