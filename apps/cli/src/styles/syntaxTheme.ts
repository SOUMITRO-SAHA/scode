import { SyntaxStyle, RGBA } from "@opentui/core"
import { colors } from "@scode/theme"

const mdConfig = {
  "markup.heading.1": { fg: RGBA.fromHex(colors.blue[500]), bold: true },
  "markup.heading.2": { fg: RGBA.fromHex(colors.blue[500]), bold: true },
  "markup.heading.3": { fg: RGBA.fromHex(colors.blue[500]), bold: true },
  "markup.bold": { fg: RGBA.fromHex(colors.gray[50]), bold: true },
  "markup.italic": { fg: RGBA.fromHex(colors.gray[50]), italic: true },
  "markup.list": { fg: RGBA.fromHex(colors.syntax.function) },
  "markup.quote": { fg: RGBA.fromHex(colors.gray[300]), italic: true },
  "markup.raw": { fg: RGBA.fromHex(colors.syntax.variable) },
  "markup.raw.block": { fg: RGBA.fromHex(colors.syntax.variable) },
  "markup.link": { fg: RGBA.fromHex(colors.blue[500]), underline: true },
  "markup.link.url": { fg: RGBA.fromHex(colors.blue[500]), underline: true },
  default: { fg: RGBA.fromHex(colors.gray[100]) },
}

const codeConfig = {
  keyword: { fg: RGBA.fromHex(colors.syntax.keyword), bold: true },
  string: { fg: RGBA.fromHex(colors.syntax.string) },
  comment: { fg: RGBA.fromHex(colors.syntax.comment), italic: true },
  number: { fg: RGBA.fromHex(colors.syntax.number) },
  "function": { fg: RGBA.fromHex(colors.syntax.function) },
  "function.call": { fg: RGBA.fromHex(colors.syntax.function) },
  "function.method.call": { fg: RGBA.fromHex(colors.syntax.function) },
  type: { fg: RGBA.fromHex(colors.syntax.type) },
  constructor: { fg: RGBA.fromHex(colors.syntax.type) },
  variable: { fg: RGBA.fromHex(colors.gray[50]) },
  "variable.member": { fg: RGBA.fromHex(colors.syntax.variable) },
  property: { fg: RGBA.fromHex(colors.syntax.variable) },
  operator: { fg: RGBA.fromHex(colors.syntax.keyword) },
  punctuation: { fg: RGBA.fromHex(colors.gray[50]) },
  "punctuation.bracket": { fg: RGBA.fromHex(colors.gray[50]) },
  "punctuation.delimiter": { fg: RGBA.fromHex(colors.gray[200]) },
  default: { fg: RGBA.fromHex(colors.gray[100]) },
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
