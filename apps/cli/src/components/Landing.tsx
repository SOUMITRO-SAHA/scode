import { Composer } from "./Composer.js"
import { KeyboardHints } from "./KeyboardHints.js"
import { TipSection } from "./TipSection.js"
import { theme } from "@scode/theme"

interface LandingProps {
  onSubmit: (value: string) => void
  loading: boolean
  width: number
  height: number
  modelDisplay?: string
}

export function Landing({ onSubmit, loading, width, height, modelDisplay }: LandingProps) {
  const showFullLogo = width >= 60 && height >= 28
  const showSmallLogo = width >= 60 && height >= 20
  const showTips = height >= 24

  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3

  return (
    <box
      flexDirection="column"
      width={width}
      height={height}
      alignItems="center"
      justifyContent="center"
    >
      {showFullLogo && (
        <>
          <ascii-font text="SCODE" font="huge" color={theme.brand.primary} />
          <text fg={theme.text.muted}>  Local AI Coding Assistant  </text>
          <box height={2} />
        </>
      )}
      {!showFullLogo && showSmallLogo && (
        <>
          <ascii-font text="SCODE" font="block" color={theme.brand.primary} />
          <text fg={theme.text.muted}>  Local AI Coding Assistant  </text>
          <box height={1} />
        </>
      )}
      {!showSmallLogo && (
        <>
          <text fg={theme.brand.primary}><strong>  SCode  </strong></text>
          <text fg={theme.text.muted}>  Local AI Coding Assistant  </text>
          <box height={1} />
        </>
      )}
      <Composer
        onSubmit={onSubmit}
        loading={loading}
        width={width}
        lines={composerLines}
        modelDisplay={modelDisplay}
      />
      <KeyboardHints />
      <TipSection show={showTips} />
    </box>
  )
}
