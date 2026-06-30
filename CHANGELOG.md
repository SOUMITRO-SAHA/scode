# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.0.0] - 2024-01-XX

### Added

#### Core Architecture

- **Client-Server Architecture**: Implemented CLI (thin client) + HTTP server (Hono on port 4100) architecture
- **Skill System**: Auto-discovery of skills from `.agents/skills/` with keyword matching and dynamic loading
- **Tool System**: Comprehensive set of tools (`read`, `write`, `edit`, `bash`, `grep`, `glob`, `skill`)
- **Session Management**: SQLite persistence via Drizzle ORM with session auto-rename and multi-session support
- **Effect Integration**: Full Effect v4 migration for dependency injection and service layer patterns

#### CLI Features

- **Interactive TUI**: React + OpenTUI terminal user interface with streaming output
- **Command Palette**: Fuzzy search for commands with keyboard shortcuts (Ctrl+P)
- **Model Switcher**: Dynamic provider and model selection interface
- **Session Sidebar**: Search, delete, and manage multiple conversation sessions
- **Markdown Rendering**: Advanced rendering with code blocks, task lists, callouts, and syntax highlighting
- **Autocomplete**: Slash command completion with fuzzy matching
- **Toast Notifications**: User-friendly feedback system
- **Dialog System**: Modal dialogs for settings, model selection, and configuration
- **Keyboard Shortcuts**: Comprehensive keyboard navigation and control system
- **Responsive Layout**: Adaptive UI with sidebar toggle and dynamic main content width

#### LLM Provider Support

- **Claude Integration**: Native adapter with extended thinking support (Sonnet 4)
- **OpenAI Compatibility**: OpenAI-compatible adapter for multiple providers
- **Gemini**: Full integration with model-specific configurations
- **DeepSeek**: Provider adapter with API support
- **Z.ai**: Coding plan provider support
- **MiniMax**: Provider integration
- **CommandCode**: OpenAI-compatible provider replacement
- **Dynamic Model Discovery**: Automatic model fetching and provider validation
- **Thinking Display**: Animated reasoning display for supported models

#### Shared Infrastructure

- **Effect Utils**: Native Effect utility modules (error, string, json, number, time)
- **Theme System**: Comprehensive design tokens with OpenCode-inspired structure
- **Type Safety**: Full TypeScript coverage with proper types and interfaces
- **API Layer**: Centralized apiFetch and apiFetchStream utilities
- **Configuration**: JSON-based config system with environment variable fallbacks
- **Logger**: Pino-based logging with daily rotation, compression, and cleanup

#### Development Tools

- **Testing Infrastructure**: Vitest workspace setup with comprehensive test coverage
- **Build System**: Turbo monorepo with pnpm workspace support
- **TypeScript Configuration**: Native TS with tsx runtime, no .js imports
- **Pre-commit Hooks**: Code formatting and quality checks
- **Development Scripts**: Hot reload, TUI auto-restart, and development workflows
- **Path Aliases**: Configurable TypeScript path mappings

### Changed

#### Architecture Improvements

- **Migration from Context to Zustand**: Replaced React Context with Zustand for state management
- **Effect v4 Migration**: Complete migration to Effect patterns for service layer
- **Modularization**: Reorganized components into feature-based subdirectories
- **Service Layer**: Centralized shutdown, initialization, and client tracking services

#### UI/UX Enhancements

- **Responsive Design**: Mobile and desktop responsive layouts
- **Visual Polish**: Rounded borders, focus states, and consistent spacing
- **Accessibility**: Improved keyboard navigation and focus management
- **Performance**: Lazy loading and optimized rendering patterns
- **Error Handling**: Comprehensive error boundaries and user-friendly error displays

#### Code Quality

- **Type Safety**: Eliminated all `any` types with proper TypeScript typing
- **Code Organization**: Consistent naming conventions and file structure
- **Import Management**: Removed .js extensions, switched to native TypeScript
- **Constants Centralization**: Consolidated scattered constants into shared modules

### Fixed

#### Bug Fixes

- **Memory Leaks**: Proper cleanup of services and event listeners
- **State Persistence**: Fixed session data persistence across reloads
- **Connection Issues**: Robust server auto-start with error handling
- **Path Resolution**: Fixed path aliases and directory traversal issues
- **CWD Propagation**: Proper working directory propagation from CLI to server
- **Model Selection**: Fixed model state persistence and provider defaults
- **UI Rendering**: Fixed nested text element crashes and markdown rendering issues
- **Dialog Focus**: Improved focus management in modals and dialogs
- **File Watching**: Fixed file-watcher crashes in development mode

### Technical Details

#### Project Structure

```
scode/
├── apps/              # CLI application
├── packages/          # Shared packages (shared, theme, etc.)
├── docs/              # Documentation
├── scripts/           # Build and development scripts
├── .agents/skills/    # Agent skills
├── features.md        # Feature documentation
└── CHANGELOG.md       # This changelog
```

#### Key Technologies

- **Runtime**: Node.js with Bun support for TUI
- **Frontend**: React + OpenTUI for terminal UI
- **Backend**: Hono HTTP server
- **Database**: SQLite with Drizzle ORM
- **Effects**: Effect v4 for service layer
- **State**: Zustand for client state
- **Testing**: Vitest for unit and integration tests
- **Build**: Turbo + pnpm workspace

#### Commands

- `pnpm cli` - Interactive TUI mode (recommended)
- `pnpm cli --prompt "..."` - Single-shot headless mode
- `pnpm server` - Start server standalone
- `pnpm test` - Run all tests
- `pnpm dev` - Development mode with auto-restart

This v0.0.0 release represents the complete foundation of the scode coding agent with all core features, comprehensive documentation, and a robust development workflow ready for production use.
