# TUI Mode

The TUI (Terminal User Interface) is the default interactive mode of scode. It uses OpenTUI with React to render a full-screen terminal application.

## Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│ scode — Agent                                              │
│ Model: claude-sonnet-4-20250515    Provider: claude         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Assistant Message                    │   │
│  │                                                      │   │
│  │  Hello! I'm scode, a mini coding agent. I can help   │   │
│  │  you with code generation, refactoring, debugging,   │   │
│  │  documentation, and more...                          │   │
│  │                                                      │   │
│  │  ▶ thinking...                                       │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ Thinking about the architecture...            │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  User Message                         │   │
│  │  What does this project do?                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Type a message...                              │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  [Ctrl+@ to send]                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Tips: Use /help for available commands  |  Ctrl+B: sidebar │
└─────────────────────────────────────────────────────────────┘
```

## UI Components

| Component           | Location      | Description                                            |
| ------------------- | ------------- | ------------------------------------------------------ |
| **Header**          | Top bar       | Shows agent name, current model, provider              |
| **Chat Area**       | Center        | Scrollable message list with user & assistant messages |
| **Composer**        | Bottom input  | Text input with autocomplete                           |
| **Session Sidebar** | Left (hidden) | Session list, toggle with `Ctrl+B`                     |
| **Footer**          | Bottom bar    | Tips, keyboard hints                                   |

## Overlay Components

| Component               | Trigger          | Description                    |
| ----------------------- | ---------------- | ------------------------------ |
| **Command Palette**     | `/` commands     | Execute built-in commands      |
| **Model Switcher**      | From commands    | Change the active LLM model    |
| **Provider Switcher**   | From commands    | Change the active LLM provider |
| **Skill Browser**       | From commands    | Browse and select skills       |
| **Thinking Panel**      | During streaming | View AI's internal reasoning   |
| **Toast Notifications** | System events    | Brief notification popups      |
