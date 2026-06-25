import { colors } from "./colors";

export const background = {
  primary: colors.gray[1000],
  secondary: colors.gray[975],
  surface: colors.gray[950],
  hover: colors.gray[900],
  active: colors.gray[850],
} as const;

export const border = {
  primary: colors.gray[800],
  secondary: colors.gray[875],
  focus: colors.blue[600],
  error: colors.red[400],
} as const;

export const text = {
  primary: colors.gray[50],
  secondary: colors.gray[200],
  muted: colors.gray[300],
  disabled: colors.gray[500],
  inverse: colors.black,
} as const;

export const brand = {
  primary: colors.blue[500],
  hover: colors.blue[300],
  active: colors.blue[650],
  subtle: colors.blue[800],
} as const;

export const markdown = {
  heading: colors.white,
  text: colors.gray[100],
  inlineCode: colors.amber[300],
  codeBackground: "#101318",
  codeBorder: colors.gray[700],
  quoteBorder: colors.blue[500],
  quoteText: colors.gray[150],
  link: colors.blue[400],
  bullet: colors.blue[500],
  tableBorder: colors.gray[600],
  tableHeader: colors.gray[925],
  rule: colors.gray[800],
} as const;

export const chat = {
  user: {
    background: "#18293F",
    border: colors.blue[500],
    text: "#F5F7FA",
  },
  assistant: {
    text: "#E6EAF0",
  },
  thinking: colors.yellow[400],
} as const;

export const input = {
  background: colors.gray[950],
  border: colors.gray[750],
  focus: colors.blue[500],
  placeholder: colors.gray[400],
} as const;

export const terminal = {
  prompt: colors.blue[500],
  command: colors.white,
  output: colors.gray[100],
  cursor: colors.blue[500],
} as const;

export const status = {
  success: colors.green[400],
  warning: colors.yellow[400],
  danger: colors.red[400],
  info: colors.cyan[300],
} as const;

export const opacity = {
  disabled: 0.45,
  muted: 0.65,
  hover: 0.85,
  pressed: 0.95,
} as const;

export const shadows = {
  sm: "0 2px 6px rgba(0,0,0,.18)",
  md: "0 8px 20px rgba(0,0,0,.25)",
  lg: "0 20px 40px rgba(0,0,0,.35)",
} as const;

export const theme = {
  background,
  border,
  text,
  brand,
  markdown,
  chat,
  input,
  terminal,
  ...status,
  opacity,
  shadows,
} as const;

export type Theme = typeof theme;
