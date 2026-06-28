# web

Standalone web UI scaffold for **scode** — a Vite + React application.

**Note:** This is a disconnected scaffold, NOT yet integrated with the scode server backend.

Built with [Vite](https://vite.dev) 8.x, React 19, and the React Compiler for auto-memoization.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Start Vite dev server    |
| `pnpm build`   | Type-check + build       |
| `pnpm preview` | Preview production build |
| `pnpm lint`    | Run ESLint               |

## Tech Stack

- **Vite 8.x** with `@rolldown/plugin-babel` (Rust-based bundler)
- **React 19** with React Compiler
- **TypeScript** ~6.0
- **ESLint** with `typescript-eslint`
- Zero internal monorepo dependencies

## Status

This app is not yet connected to the scode server. Future work will integrate it as a full web frontend for scode.
