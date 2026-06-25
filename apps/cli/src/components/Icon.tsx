import type { ReactNode } from "react"
import { theme } from "@scode/theme"

export type IconName =
  | "lightbulb"
  | "lightbulb-filament"
  | "list"
  | "circle"
  | "circle-dashed"
  | "x"
  | "plus"
  | "caret-right"
  | "check"
  | "magic-wand"
  | "terminal-window"
  | "gear"
  | "sparkle"

const ICONS: Record<IconName, string> = {
  lightbulb: "\u{1F4A1}",
  "lightbulb-filament": "\u{1F4A1}",
  list: "\u2630",
  circle: "\u25CF",
  "circle-dashed": "\u25CB",
  x: "\u2715",
  plus: "+",
  "caret-right": "\u276F",
  check: "\u2713",
  "magic-wand": "\u2726",
  "terminal-window": "\u276F",
  gear: "\u2699",
  sparkle: "\u2728",
}

interface IconProps {
  name: IconName
  color?: string
  padRight?: number
}

export function Icon({ name, color, padRight = 0 }: IconProps) {
  return (
    <text fg={color ?? theme.text.muted} paddingRight={padRight}>
      {ICONS[name]}
    </text>
  )
}

export function icon(name: IconName): ReactNode {
  return ICONS[name]
}
