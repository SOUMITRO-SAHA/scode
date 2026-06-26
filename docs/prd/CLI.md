# Mini Agent CLI UI Specification (Claude Code Inspired)

## Design Goals

The interface should feel like a modern AI coding assistant rather than a traditional terminal.

Primary inspirations:

- Claude Code
- ChatGPT Desktop
- Warp AI
- GitHub Copilot Chat

Principles:

- Conversation first
- Minimal chrome
- Full Markdown rendering
- Keyboard-first
- Responsive terminal layout
- No unnecessary borders

---

# Overall Layout

````
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ 🤖 SCode                                                   Claude Sonnet • Local Server  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                                                                          │
│   ╭──────────────────────────────────────────────────────────────────────────────────╮   │
│   │ You                                                                     just now │   │
│   │──────────────────────────────────────────────────────────────────────────────────│   │
│   │ I'm new to this project. What should I do first?                                 │   │
│   ╰──────────────────────────────────────────────────────────────────────────────────╯   │
│                                                                                          │
│   Mini Agent                                                                             │
│                                                                                          │
│   # Welcome to our agent!                                                                │
│                                                                                          │
│   This repository implements the Agent Skills specification...                           │
│                                                                                          │
│   ## First Steps                                                                         │
│                                                                                          │
│   • Read the README                                                                      │
│   • Install dependencies                                                                 │
│   • Explore available skills                                                             │
│                                                                                          │
│   ```bash                                                                                │
│   pnpm install                                                                           │
│   pnpm dev                                                                               │
│   ```                                                                                    │
│                                                                                          │
│──────────────────────────────────────────────────────────────────────────────────────────│
│ Ctrl+C Exit • Ctrl+L Clear • Ctrl+D Debug • /help                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ╭──────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ Type your message...                                                                 │ │
│ │                                                                                      │ │
│ │                                                                                      │ │
│ ╰──────────────────────────────────────────────────────────────────────────────────────╯ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
````

---

# Header

Left

```
🤖 Mini Agent
```

Right

```
Claude Sonnet • Local Server
```

Future additions

```
Claude Sonnet
3 Skills Loaded
Connected
Conversation #3
```

---

# Conversation Area

The conversation occupies almost the entire terminal.

Messages are separated using whitespace instead of heavy borders.

No avatars.

No timestamps on assistant responses.

Smooth scrolling.

---

# User Messages

User messages should be visually highlighted.

Style:

- Rounded bordered container
- Slightly darker background
- Accent coloured border
- Right aligned title

Example

```
╭──────────────────────────────╮
│ You                          │
├──────────────────────────────┤
│ Explain this repository.     │
╰──────────────────────────────╯
```

User cards should stand out immediately.

---

# Assistant Messages

Assistant responses have **no surrounding box**.

They pass content through `<MarkdownRenderer>`:

```tsx
<MarkdownRenderer markdown={response.content} />
```

The renderer handles all parsing, AST walking, and OpenTUI component instantiation. The response should feel like reading Markdown in a documentation viewer.

````
Mini Agent

# Heading

Normal paragraph.

## Section

• Bullet

• Bullet

```ts
console.log("hello")
````

| Name | Value |
| ---- | ----- |
| A    | B     |

> Blockquote

Inline `code`

---

```

---

# Markdown Rendering

## Architecture

The renderer must **never** dump raw Markdown into the terminal:

```

LLM Stream
│
▼
Incremental Text Buffer
│
▼
Markdown Parser (remark)
│
▼
Markdown AST (mdast)
│
▼
OpenTUI Component Tree
│
▼
Terminal

```

Not:

```

LLM → stdout.write(markdown)

```

## How it works

Every time new tokens arrive via streaming:

1. Tokens are appended to an internal text buffer.
2. The full buffer is re-parsed with `remark-parse` into a stable AST (mdast).
3. The AST is walked and each node is mapped to an OpenTUI component.
4. The component tree is reconciled (React-style diffing).

This means the buffer is **continuously re-parsed** on every update:

```

Token 1: "#"
Token 2: "# Wel"
Token 3: "# Welcome"
Token 4: "# Welcome to"
Token 5: "# Welcome to our agent"

```

Each tick triggers a full parse, so the heading appears as a styled heading immediately — not as raw text that snaps into formatted output after streaming finishes.

## Supported nodes

- Headings (H1–H6)
- Paragraphs
- Bold / Strong
- Italic / Emphasis
- Inline code
- Code fences (with syntax highlighting)
- Lists (ordered, unordered)
- Nested lists
- Tables (with GFM support)
- Links
- Blockquotes
- Horizontal rules
- Task lists
- Emoji
- Auto wrapping
- ANSI colours

Markdown should never be printed as raw text.

## Component mapping

```

mdast node OpenTUI Component
─────────────────────────────────────
heading <Heading />
paragraph <Text />
strong <Bold />
emphasis <Italic />
inlineCode <InlineCode />
code <CodeBlock />
list <List />
listItem <ListItem />
table <Table />
tableRow <TableRow />
tableCell <TableCell />
link <Link />
blockquote <BlockQuote />
thematicBreak <HorizontalRule />

```

## Component hierarchy

```

components/
Chat/
ChatMessage.tsx
UserMessage.tsx
AssistantMessage.tsx
Markdown/
MarkdownRenderer.tsx # Accepts raw text → remark → AST → components
MarkdownBlock.tsx # Switch node type → component
Heading.tsx
Text.tsx
Bold.tsx
Italic.tsx
InlineCode.tsx
CodeBlock.tsx
List.tsx
ListItem.tsx
Table.tsx
TableRow.tsx
TableCell.tsx
Link.tsx
BlockQuote.tsx
HorizontalRule.tsx

````

Assistant messages should use this pattern:

```tsx
<MarkdownRenderer markdown={message.content} />
````

The MarkdownRenderer component owns the buffer, the remark parser, and the AST-to-component mapping.

## Why remark

The pipeline is built on the `remark` ecosystem rather than hand-written Markdown logic:

- **Stable parsing** — battle-tested, spec-compliant CommonMark + GFM
- **Easy to extend** — remark plugins for syntax highlighting, math, etc.
- **Clean AST** — `mdast` is well-documented and easy to walk
- **Nested lists** — remark handles indentation and nesting correctly
- **Tables** — built-in GFM table support
- **Streaming-safe** — incremental content parses cleanly at every partial state

---

# Code Blocks

Code blocks receive special styling.

```

TypeScript

──────────────────────────────────────

const app = new Agent();

app.start();

──────────────────────────────────────

```

Features:

- Syntax highlighting
- Scroll horizontally
- Preserve indentation
- Line wrapping disabled
- Copy shortcut (future)

---

# Tables

Render clean terminal tables.

```

Model Context

Claude 200K

GPT 128K

```

Never output Markdown syntax directly.

---

# Streaming Behaviour

The stream is **continuously re-parsed**. Every time new tokens arrive, the entire text buffer is fed through remark again.

## Detail

Streaming never outputs raw text. Each incremental update follows the full pipeline:

```
Token buffer append
        │
        ▼
remark-parse (full buffer)
        │
        ▼
mdast (stable AST)
        │
        ▼
Walk AST → instantiate OpenTUI components
        │
        ▼
Reconcile screen (React-style diffing)
```

## Example

```
Token 1:  "#"
            ↓ re-parse → Heading component
Token 2:  "# Wel"
            ↓ re-parse → Heading("Wel")
Token 3:  "# Welcome"
            ↓ re-parse → Heading("Welcome")
Token 4:  "# Welcome to"
            ↓ re-parse → Heading("Welcome to")
Token 5:  "# Welcome to\n\n## our agent"
            ↓ re-parse → Heading("Welcome to") + Heading("our agent")
```

Formatting is preserved throughout the stream. No raw Markdown is ever visible to the user.

The typing experience should feel similar to Claude Code.

---

# Thinking State

During processing

```

Thinking...

Reading Skills

✓ welcome-me

✓ documentation

Building Prompt

Calling Claude

Streaming Response...

```

Automatically disappears once the first token arrives.

---

# Skill Loading

When debugging is enabled

```

Matched Skills

✓ welcome-me

Priority

High

Reason

User asked for onboarding.

```

Hidden by default.

---

# Prompt Composer

The prompt composer is fixed at **three visible lines**.

```

╭────────────────────────────────────────────────────────────╮
│ Type your message...                                       │
│                                                            │
│                                                            │
╰────────────────────────────────────────────────────────────╯

```

Behaviour

- Minimum height: 3 lines
- Maximum visible height: 3 lines
- Additional text scrolls internally
- Enter submits
- Shift+Enter inserts newline

The composer should never grow beyond three lines.

---

# Footer

Always visible.

```

Ctrl+C Exit

Ctrl+L Clear

Ctrl+D Debug

/help Commands

```

---

# Slash Commands

Supported commands

```

/help

/skills

/history

/debug

/config

/model

/clear

/exit

```

Autocomplete using Tab.

---

# Empty Screen

```

```

                     🤖 Mini Agent

            Your local AI coding assistant.

```

──────────────────────────────────────────────────────────────

Examples

• Explain this repository

• I'm new to this project

• Generate documentation

• Create a changelog

──────────────────────────────────────────────────────────────

╭────────────────────────────────────────────────────────────╮
│ Type your message...                                       │
│                                                            │
│                                                            │
╰────────────────────────────────────────────────────────────╯

```

---

# Colours

Assistant Heading

Bright White

Assistant Text

Default

User Card

Blue Accent

Inline Code

Yellow

Code Block

Dark Background

Links

Cyan

Success

Green

Warnings

Yellow

Errors

Red

Thinking

Blue

---

# Keyboard Shortcuts

Enter

Submit

Shift+Enter

New line

Ctrl+C

Exit

Ctrl+L

Clear conversation

Ctrl+D

Toggle debug panel

Tab

Autocomplete slash commands

↑

Previous prompt history

↓

Next prompt history

Ctrl+R

Resend previous prompt

---

# Future Features

- Conversation history sidebar
- Session persistence
- Model selector
- File attachments
- Streaming tool execution
- Token usage
- Cost estimation
- Response regeneration
- Conversation search
- Multi-agent mode
- Theme switching
- Vim keybindings
- Mouse support

---

# User Experience Goals

The interface should resemble a native AI chat application rather than a command-line program.

The user's attention should remain on the conversation. User prompts should be clearly distinguished using subtle cards, while assistant responses should read like beautifully rendered documentation with complete Markdown support. The composer should always remain visible, occupy exactly three lines, and feel lightweight and responsive. During generation, the UI should communicate progress clearly without overwhelming the user, closely matching the polished experience of Claude Code.
