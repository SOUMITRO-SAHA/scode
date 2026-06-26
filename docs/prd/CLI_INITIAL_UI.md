# Initial Screen (Landing UI)

## Design Philosophy

The landing screen should feel like opening a modern AI development environment.

There is no conversation yet.

The screen should feel calm, spacious, and minimal.

Inspired by:

- OpenCode
- Claude Code
- Warp
- Raycast
- ChatGPT Desktop

---

# Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                     ███████                                                │
│                                   ██       ██                                              │
│                                  ██  SCode  ██                                             │
│                                   ██       ██                                              │
│                                     ███████                                                │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│                                                                                            │
│          ╭────────────────────────────────────────────────────────────────────────────╮    │
│          │ Ask anything... "Explain this repository"                                  │    │
│          │                                                                            │    │
│          │                                                                            │    │
│          ├────────────────────────────────────────────────────────────────────────────┤    │
│          │ 🤖 Claude Sonnet │ Local │ Ready │ 3 Skills │ /help                        │    │
│          ╰────────────────────────────────────────────────────────────────────────────╯    │
│                                                                                            │
│                        tab models      ctrl+p commands      /help                          │
│                                                                                            │
│                                                                                            │
│  💡 Tip                                                                                    │
│  Use /skills to explore installed skills or simply ask a question.                         │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# Logo

The logo sits roughly one-third from the top of the screen.

```
SCode
```

Rendered using a pixel or block font.

Below it:

```
Local AI Coding Assistant
```

Small and subtle.

---

# Prompt Composer

The composer is the primary focus.

```
╭────────────────────────────────────────────────────────────╮
│ Ask anything...                                            │
│                                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 🤖 Claude Sonnet │ Local │ Ready │ 3 Skills │ /help        │
╰────────────────────────────────────────────────────────────╯
```

Exactly **3 visible input lines**.

---

# Bottom Status

The lower bar communicates the active environment.

Example

```
🤖 Claude Sonnet
```

```
🏠 Local Server
```

```
✓ Connected
```

```
3 Skills Loaded
```

Future

```
Workspace detected
```

---

# Keyboard Hints

Below the composer.

```
tab models

ctrl+p commands

/help

ctrl+l clear

ctrl+c quit
```

Muted colours.

Small text.

---

# Tip Section

One rotating tip.

Examples

```
💡 Tip

Run /skills to list available skills.
```

---

```
💡 Tip

Use @filename to include a file in your prompt.
```

---

```
💡 Tip

Press Tab to switch models.
```

---

```
💡 Tip

Type /help for all available commands.
```

Random on every launch.

---

# Empty Conversation State

Once the user submits the first message:

The logo fades away.

The conversation smoothly expands upward.

No page refresh.

Animation should feel natural.

---

# First Message Transition

Landing

```
Logo

↓

Prompt
```

↓

User presses Enter

↓

```
Logo fades out

Conversation scrolls into place

User message appears

Assistant starts streaming
```

---

# Loading State

Immediately after pressing Enter

```
Reading Skills...

✓ welcome-me

✓ documentation

Building Prompt...

Calling Claude...
```

This panel disappears when the first streamed token arrives.

---

# Connected Indicators

Examples

```
🟢 Claude Sonnet
```

```
🟢 Local Server
```

```
🟢 Agent Ready
```

If disconnected

```
🔴 Server Offline
```

---

# Colours

Background

Near black

Logo

Bright white

Prompt border

Blue accent

Status

Grey

Tips

Amber

Ready

Green

Errors

Red

---

# Responsive Behaviour

Large Terminal

Logo remains centred.

Medium Terminal

Logo scales down.

Small Terminal

Hide logo.

Show only:

```
SCode

Ask anything...
```

---

# Animation

Launch

```
Fade logo

↓

Fade composer

↓

Blink cursor
```

First Prompt

```
Fade logo

↓

Expand conversation

↓

Stream response
```

No unnecessary motion.

Everything should feel lightweight.

---

# Overall Feeling

The landing page should resemble opening a premium AI coding application rather than a terminal program.

The screen should have ample whitespace, a single clear call to action, and subtle status information. It should communicate confidence and readiness without overwhelming the user. Once the first prompt is submitted, the interface should transition seamlessly into the conversational layout without any jarring changes.
