import { SyntaxStyle, RGBA } from "@opentui/core"

const mdConfig = {
  "markup.heading.1": { fg: RGBA.fromHex("#58A6FF"), bold: true },
  "markup.heading.2": { fg: RGBA.fromHex("#58A6FF"), bold: true },
  "markup.heading.3": { fg: RGBA.fromHex("#58A6FF"), bold: true },
  "markup.bold": { fg: RGBA.fromHex("#F0F6FC"), bold: true },
  "markup.italic": { fg: RGBA.fromHex("#F0F6FC"), italic: true },
  "markup.list": { fg: RGBA.fromHex("#FF7B72") },
  "markup.quote": { fg: RGBA.fromHex("#8B949E"), italic: true },
  "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
  "markup.raw.block": { fg: RGBA.fromHex("#A5D6FF") },
  "markup.link": { fg: RGBA.fromHex("#58A6FF"), underline: true },
  "markup.link.url": { fg: RGBA.fromHex("#58A6FF"), underline: true },
  default: { fg: RGBA.fromHex("#E6EDF3") },
}

const codeConfig = {
  keyword: { fg: RGBA.fromHex("#FF7B72"), bold: true },
  string: { fg: RGBA.fromHex("#A5D6FF") },
  comment: { fg: RGBA.fromHex("#8B949E"), italic: true },
  number: { fg: RGBA.fromHex("#79C0FF") },
  "function": { fg: RGBA.fromHex("#D2A8FF") },
  "function.call": { fg: RGBA.fromHex("#D2A8FF") },
  "function.method.call": { fg: RGBA.fromHex("#D2A8FF") },
  type: { fg: RGBA.fromHex("#FFA657") },
  constructor: { fg: RGBA.fromHex("#FFA657") },
  variable: { fg: RGBA.fromHex("#E6EDF3") },
  "variable.member": { fg: RGBA.fromHex("#79C0FF") },
  property: { fg: RGBA.fromHex("#79C0FF") },
  operator: { fg: RGBA.fromHex("#FF7B72") },
  punctuation: { fg: RGBA.fromHex("#F0F6FC") },
  "punctuation.bracket": { fg: RGBA.fromHex("#F0F6FC") },
  "punctuation.delimiter": { fg: RGBA.fromHex("#C9D1D9") },
  default: { fg: RGBA.fromHex("#E6EDF3") },
}

let _mdStyle: SyntaxStyle | null = null
let _codeStyle: SyntaxStyle | null = null

export function getMarkdownStyle(): SyntaxStyle {
  if (!_mdStyle) _mdStyle = SyntaxStyle.fromStyles(mdConfig)
  return _mdStyle
}

export function getCodeStyle(): SyntaxStyle {
  if (!_codeStyle) _codeStyle = SyntaxStyle.fromStyles(codeConfig)
  return _codeStyle
}
