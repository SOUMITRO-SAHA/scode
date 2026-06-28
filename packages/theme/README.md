# @scode/theme

Design tokens for **scode** — colors, typography, spacing, and layout tokens used by the CLI (OpenTUI) and future web frontend.

Zero runtime dependencies.

Developed by [SOUMITRA SAHA](mailto:soumitrosahaofficial@gmail.com).

## Exports

All tokens are exported from the single root entry:

```typescript
import { colors, layout, spacing, theme, typography } from "@scode/theme";
```

### `theme` — merged token object

| Section      | Tokens                                     |
| ------------ | ------------------------------------------ |
| `background` | Base, surface, elevated, modal, chat       |
| `text`       | Primary, secondary, muted, accent, inverse |
| `border`     | Default, focus, muted, selected            |
| `brand`      | Primary, secondary, accent                 |
| `markdown`   | Heading, code, link, quote, list, table    |
| `chat`       | User bubble, assistant, system             |
| `input`      | Background, text, placeholder, cursor      |
| `terminal`   | Background, foreground, cursor, selection  |
| `status`     | Success, warning, error, info              |
| `opacity`    | Dim, disabled, hover, overlay              |

### Layout tokens

Used for responsive terminal layouts (OpenTUI flexbox) and future CSS.

- `breakpoints`: `sm=80`, `md=100`, `lg=120` columns
- `sidebar.width`: 30 columns
- `content.maxWidth` / `content.minWidth` / `content.promptMaxWidth`
- `composer.linesByHeight`: compact (1), normal (2), spacious (3)
- Utilities: `getBreakpoint(width)`, `isWide(width)`, `getComposerLines(height)`

## Scripts

| Command            | Description |
| ------------------ | ----------- |
| `pnpm check-types` | Type-check  |
| `pnpm test`        | Run tests   |
