# @scode/theme

The `@scode/theme` package provides design tokens for the scode terminal UI. It has **zero runtime dependencies**.

## Import

```typescript
import { colors, layout, spacing, typography } from "@scode/theme";
```

## Design Tokens

### Colors (`colors.ts`)

```typescript
export const colors = {
  // UI Colors
  primary: "#6366f1", // Indigo
  success: "#22c55e", // Green
  warning: "#eab308", // Yellow
  error: "#ef4444", // Red
  info: "#3b82f6", // Blue

  // Background
  bg: {
    base: "#0a0a0f", // Deep dark background
    surface: "#1a1a2e", // Card/surface background
    input: "#2a2a3e", // Input field background
  },

  // Text
  text: {
    primary: "#e2e8f0", // Primary text
    secondary: "#94a3b8", // Secondary/muted text
    muted: "#64748b", // Placeholder text
    accent: "#a5b4fc", // Accent text
  },

  // Borders
  border: "#2a2a3e",
};
```

### Spacing (`spacing.ts`)

```typescript
export const spacing = {
  xxs: 1, // 1 unit
  xs: 2, // 2 units
  sm: 4, // 4 units
  md: 6, // 6 units
  lg: 8, // 8 units
  xl: 12, // 12 units
  xxl: 16, // 16 units
};
```

### Typography (`typography.ts`)

```typescript
export const typography = {
  fontSize: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

### Layout (`layout.ts`)

```typescript
export const layout = {
  sidebar: {
    width: 28, // Characters
    minWidth: 20,
    maxWidth: 40,
  },
  chat: {
    maxWidth: 120, // Characters
    padding: 2,
  },
  header: {
    height: 3, // Lines
  },
  footer: {
    height: 1, // Lines
  },
};
```

## Usage

The theme tokens are used by the CLI's React components for consistent styling across the TUI:

```typescript
import { Box, Text } from "@opentui/react"
import { colors } from "@scode/theme"

export function MyComponent() {
  return (
    <Box>
      <Text color={colors.primary}>Hello scode</Text>
    </Box>
  )
}
```
