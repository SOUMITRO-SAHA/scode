import { colors } from "./colors";

export const background = {
  primary: colors.gray[1000],
  secondary: colors.gray[975],
  surface: colors.gray[950],
  hover: colors.gray[900],
  active: colors.gray[850],
  weak: colors.gray[925],
  strong: colors.gray[1000],
  stronger: colors.gray[1000],
  inset: colors.gray[950],
  insetHover: colors.gray[900],
  raised: colors.gray[975],
  raisedHover: colors.gray[925],
  float: colors.gray[950],
  floatHover: colors.gray[900],
} as const;

export const border = {
  primary: colors.gray[800],
  secondary: colors.gray[875],
  focus: colors.blue[600],
  error: colors.red[400],
  weak: colors.gray[850],
  strong: colors.gray[750],
  selected: colors.blue[500],
  disabled: colors.gray[875],
  hover: colors.gray[750],
  active: colors.gray[700],
  success: colors.green[400],
  warning: colors.yellow[400],
  info: colors.cyan[300],
} as const;

export const text = {
  primary: colors.gray[50],
  secondary: colors.gray[200],
  muted: colors.gray[300],
  disabled: colors.gray[500],
  inverse: colors.black,
  weaker: colors.gray[400],
  stronger: colors.white,
  interactive: colors.blue[400],
  onBrand: colors.white,
  onInteractive: colors.white,
  onSuccess: colors.white,
  onWarning: colors.black,
  onError: colors.white,
  onInfo: colors.black,
} as const;

export const brand = {
  primary: colors.blue[500],
  hover: colors.blue[300],
  active: colors.blue[650],
  subtle: colors.blue[800],
  weak: colors.blue[800],
  strong: colors.blue[400],
} as const;

export const icon = {
  primary: colors.gray[300],
  secondary: colors.gray[400],
  muted: colors.gray[500],
  disabled: colors.gray[600],
  hover: colors.gray[200],
  active: colors.gray[100],
  brand: colors.blue[500],
  interactive: colors.blue[400],
  success: colors.green[400],
  warning: colors.yellow[400],
  error: colors.red[400],
  info: colors.cyan[300],
} as const;

export const button = {
  primary: {
    background: colors.blue[500],
    hover: colors.blue[400],
    active: colors.blue[650],
    disabled: colors.gray[700],
    text: colors.white,
  },
  secondary: {
    background: colors.gray[800],
    hover: colors.gray[750],
    active: colors.gray[700],
    disabled: colors.gray[850],
    text: colors.gray[100],
  },
  ghost: {
    background: "transparent",
    hover: colors.gray[900],
    active: colors.gray[850],
    disabled: "transparent",
    text: colors.gray[200],
  },
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
  emphasis: colors.yellow[400],
  strong: colors.amber[300],
  strikethrough: colors.gray[500],
} as const;

export const chat = {
  user: {
    background: colors.gray[600],
    border: colors.gray[600],
    text: "#F5F7FA",
    timestamp: colors.gray[400],
  },
  assistant: {
    text: "#E6EAF0",
  },
  thinking: colors.yellow[400],
  tool: {
    border: colors.gray[700],
    background: colors.gray[950],
    icon: colors.gray[400],
    iconRunning: colors.blue[400],
    iconSuccess: colors.green[400],
    iconError: colors.red[400],
    label: colors.gray[300],
    labelRunning: colors.blue[300],
    labelMuted: colors.gray[500],
    input: colors.gray[400],
    result: colors.gray[200],
    resultError: colors.red[300],
  },
} as const;

export const input = {
  background: colors.gray[950],
  border: colors.gray[750],
  focus: colors.blue[500],
  placeholder: colors.gray[400],
  hover: colors.gray[900],
  active: colors.gray[850],
  disabled: colors.gray[925],
  text: colors.gray[100],
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
  successHover: colors.green[300],
  warningHover: colors.yellow[300],
  dangerHover: colors.red[300],
  infoHover: colors.cyan[200],
  successSubtle: colors.green[800],
  warningSubtle: colors.yellow[800],
  dangerSubtle: colors.red[800],
  infoSubtle: colors.cyan[800],
} as const;

export const diff = {
  add: colors.green[400],
  addBackground: colors.green[800],
  addBorder: colors.green[600],
  delete: colors.red[400],
  deleteBackground: colors.red[800],
  deleteBorder: colors.red[600],
  unchanged: colors.gray[950],
  skip: colors.gray[900],
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
  icon,
  button,
  markdown,
  chat,
  input,
  terminal,
  ...status,
  diff,
  opacity,
  shadows,
} as const;

export type Theme = typeof theme;
