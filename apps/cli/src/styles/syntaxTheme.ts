import { RGBA, SyntaxStyle } from "@opentui/core";
import { colors, theme } from "@scode/theme";

const mdConfig = {
  "markup.heading.1": {
    fg: RGBA.fromHex(colors.white),
    bold: true,
  },
  "markup.heading.2": {
    fg: RGBA.fromHex(colors.white),
    bold: true,
  },
  "markup.heading.3": {
    fg: RGBA.fromHex(colors.gray[100]),
    bold: true,
  },
  "markup.heading.4": {
    fg: RGBA.fromHex(colors.gray[150]),
    bold: true,
  },
  "markup.heading.5": {
    fg: RGBA.fromHex(colors.gray[200]),
    bold: true,
  },
  "markup.heading.6": {
    fg: RGBA.fromHex(colors.gray[250]),
    bold: true,
  },
  "markup.bold": {
    fg: RGBA.fromHex(colors.white),
    bold: true,
  },
  "markup.italic": {
    fg: RGBA.fromHex(colors.gray[150]),
    italic: true,
  },
  "markup.list": {
    fg: RGBA.fromHex(colors.blue[400]),
    bold: true,
  },
  "markup.quote": {
    fg: RGBA.fromHex(theme.markdown.quoteText),
    italic: true,
  },
  "markup.raw": {
    fg: RGBA.fromHex(theme.markdown.inlineCode),
  },
  "markup.raw.block": {
    fg: RGBA.fromHex(theme.markdown.inlineCode),
  },
  "markup.link": {
    fg: RGBA.fromHex(theme.markdown.link),
    underline: true,
  },
  "markup.link.url": {
    fg: RGBA.fromHex(theme.markdown.link),
    underline: true,
  },
  "markup.strikethrough": {
    fg: RGBA.fromHex(theme.markdown.strikethrough),
  },
  "markup.hr": {
    fg: RGBA.fromHex(theme.markdown.rule),
  },
  default: {
    fg: RGBA.fromHex(theme.markdown.text),
  },
};

const codeConfig = {
  keyword: { fg: RGBA.fromHex(colors.syntax.keyword), bold: true },
  string: { fg: RGBA.fromHex(colors.syntax.string) },
  comment: { fg: RGBA.fromHex(colors.syntax.comment), italic: true },
  number: { fg: RGBA.fromHex(colors.syntax.number) },
  function: { fg: RGBA.fromHex(colors.syntax.function) },
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
};

const diffConfig = {
  "diff.add": {
    fg: RGBA.fromHex(theme.markdown.diff.add),
    bg: RGBA.fromHex(theme.markdown.diff.addBg),
  },
  "diff.delete": {
    fg: RGBA.fromHex(theme.markdown.diff.delete),
    bg: RGBA.fromHex(theme.markdown.diff.deleteBg),
  },
  "diff.context": {
    fg: RGBA.fromHex(theme.markdown.diff.context),
  },
  "diff.header": {
    fg: RGBA.fromHex(theme.markdown.diff.header),
    bold: true,
  },
  default: {
    fg: RGBA.fromHex(colors.gray[100]),
  },
};

let _mdStyle: SyntaxStyle | null = null;
let _codeStyle: SyntaxStyle | null = null;
let _diffStyle: SyntaxStyle | null = null;

export function getMarkdownStyle(): SyntaxStyle {
  if (!_mdStyle) _mdStyle = SyntaxStyle.fromStyles(mdConfig);
  return _mdStyle;
}

export function getCodeStyle(): SyntaxStyle {
  if (!_codeStyle) _codeStyle = SyntaxStyle.fromStyles(codeConfig);
  return _codeStyle;
}

export function getDiffStyle(): SyntaxStyle {
  if (!_diffStyle) _diffStyle = SyntaxStyle.fromStyles(diffConfig);
  return _diffStyle;
}
