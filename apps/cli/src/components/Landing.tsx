import { Composer } from "./Composer.js"
import { KeyboardHints } from "./KeyboardHints.js"
import { TipSection } from "./TipSection.js"
import { theme } from "../styles/theme.js"

interface LandingProps {
  onSubmit: (value: string) => void
  loading: boolean
  width: number
  height: number
}

export function Landing({ onSubmit, loading, width, height }: LandingProps) {
  const showLogo = width >= 60

  return (
    <box
      flexDirection="column"
      width={width}
      height={height}
      alignItems="center"
      justifyContent="center"
    >
      {showLogo && (
        <>
          <ascii-font text="SCODE" font="huge" color={theme.accent} />
          <text fg={theme.muted}>  Local AI Coding Assistant  </text>
          <box height={2} />
        </>
      )}
      {!showLogo && (
        <>
          <text fg={theme.accent}><strong>  SCode  </strong></text>
          <box height={1} />
        </>
      )}
      <Composer onSubmit={onSubmit} loading={loading} width={width} />
      <KeyboardHints />
      <TipSection />
    </box>
  )
}
