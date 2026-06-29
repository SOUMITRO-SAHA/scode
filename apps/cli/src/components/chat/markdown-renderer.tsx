import { useMemo } from "react";

import { getMarkdownStyle } from "../../styles/syntaxTheme";

import { theme } from "@scode/theme";

const TASK_CHECKED = "☑";
const TASK_UNCHECKED = "☐";

const BULLETS = ["●", "○", "◆", "◇"];
const NUMBERED_REGEX = /^(\s*)(\d+)\.\s/;

const CALLOUT_ICONS: Record<string, string> = {
  note: "ℹ",
  tip: "💡",
  important: "❗",
  warning: "⚠",
  caution: "🚨",
};

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  py: "Python",
  python: "Python",
  rs: "Rust",
  rust: "Rust",
  go: "Go",
  rb: "Ruby",
  ruby: "Ruby",
  java: "Java",
  kt: "Kotlin",
  kotlin: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  cs: "C#",
  "c#": "C#",
  php: "PHP",
  dart: "Dart",
  scala: "Scala",
  lua: "Lua",
  r: "R",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  fish: "Fish",
  ps1: "PowerShell",
  powershell: "PowerShell",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  xml: "XML",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  md: "Markdown",
  markdown: "Markdown",
  dockerfile: "Dockerfile",
  makefile: "Makefile",
  cmake: "CMake",
  graphql: "GraphQL",
  gql: "GraphQL",
  prisma: "Prisma",
  diff: "Diff",
  patch: "Patch",
};

function preprocessTaskLists(content: string): string {
  return content.replace(/^(\s*)- \[([ xX])\]\s*/gm, (_, indent, checked) => {
    const marker =
      checked.toLowerCase() === "x" ? TASK_CHECKED : TASK_UNCHECKED;
    return `${indent}${marker} `;
  });
}

function getNestingLevel(indentSpaces: number): number {
  if (indentSpaces < 4) return 0;
  return Math.floor(indentSpaces / 4);
}

function preprocessListItems(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^( *)([-*+])\s+(.*)$/);
    if (bulletMatch) {
      const [, spaces, , text] = bulletMatch;
      const indentCount = spaces.length;
      const nestingLevel = getNestingLevel(indentCount);
      const bullet = BULLETS[nestingLevel % BULLETS.length];
      const normalizedIndent = "  ".repeat(nestingLevel);
      result.push(`${normalizedIndent}${bullet} ${text}`);
      continue;
    }

    const numberedMatch = line.match(/^( *)(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      const [, spaces, num, text] = numberedMatch;
      const indentCount = spaces.length;
      const nestingLevel = getNestingLevel(indentCount);
      const normalizedIndent = "  ".repeat(nestingLevel);
      result.push(`${normalizedIndent}${num}. ${text}`);
      continue;
    }

    result.push(line);
  }

  return result.join("\n");
}

function preprocessCallouts(content: string): string {
  return content.replace(
    /> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/gi,
    (match, type) => {
      const lowerType = type.toLowerCase();
      const icon = CALLOUT_ICONS[lowerType] || CALLOUT_ICONS.note;
      return `> ${icon} **${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}**: `;
    },
  );
}

function getLanguageComment(language: string): {
  prefix: string;
  suffix: string;
} {
  const lang = language.toLowerCase();
  const commentStyles: Record<string, [string, string]> = {
    default: ["// ", ""],
    python: ["# ", ""],
    ruby: ["# ", ""],
    bash: ["# ", ""],
    shell: ["# ", ""],
    zsh: ["# ", ""],
    fish: ["# ", ""],
    powershell: ["# ", ""],
    ps1: ["# ", ""],
    sql: ["-- ", ""],
    lua: ["-- ", ""],
    html: ["<!-- ", " -->"],
    xml: ["<!-- ", " -->"],
    css: ["/* ", " */"],
    scss: ["/* ", " */"],
    sass: ["/* ", " */"],
    less: ["/* ", " */"],
  };

  const [prefix, suffix] = commentStyles[lang] || commentStyles.default;
  return { prefix, suffix };
}

function preprocessCodeBlocks(content: string): string {
  return content.replace(/^(`{3,})(\w*)\n/gm, (match, fence, language) => {
    if (!language) return match;

    const displayName =
      LANGUAGE_DISPLAY_NAMES[language.toLowerCase()] || language.toUpperCase();
    const { prefix, suffix } = getLanguageComment(language);
    const badgeLine = `${prefix}${displayName}${suffix}\n`;

    return `${fence}${language}\n${badgeLine}`;
  });
}

function preprocessDiffBlocks(content: string): string {
  return content;
}

export function preprocessMarkdown(content: string): string {
  let processed = content;
  processed = preprocessTaskLists(processed);
  processed = preprocessListItems(processed);
  processed = preprocessCallouts(processed);
  processed = preprocessCodeBlocks(processed);
  processed = preprocessDiffBlocks(processed);
  return processed;
}

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
}

export function MarkdownRenderer({
  content,
  streaming,
}: MarkdownRendererProps) {
  const style = useMemo(() => getMarkdownStyle(), []);
  const processedContent = useMemo(
    () => preprocessMarkdown(content),
    [content],
  );

  return (
    <markdown
      content={processedContent}
      syntaxStyle={style}
      streaming={streaming}
      conceal
      tableOptions={{
        style: "grid",
        borderStyle: "single",
        borderColor: theme.markdown.tableBorder,
        cellPadding: 1,
      }}
    />
  );
}

export { getMarkdownStyle };
