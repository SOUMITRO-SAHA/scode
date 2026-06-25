export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["Geist Mono", "JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"],
  },
  fontSize: {
    display: "48px",
    h1: "32px",
    h2: "24px",
    h3: "20px",
    h4: "18px",
    body: "15px",
    small: "13px",
    caption: "12px",
    code: "14px",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const
