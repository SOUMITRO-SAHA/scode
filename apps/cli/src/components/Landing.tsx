import { theme } from "@scode/theme"
import { useHealth } from "../hooks/useApi"
import { useAppStore } from "../store/index"
import { Composer } from "./Composer"
import { KeyboardHints } from "./KeyboardHints"
import { TipSection } from "./TipSection"

interface LandingProps {
  onSubmit: (value: string) => void
  streaming: boolean
  width: number
  height: number
  modelDisplay?: string
}

export function Landing({ onSubmit, streaming, width, height, modelDisplay }: LandingProps) {
  const serverUrl = useAppStore((s) => s.serverUrl)
  const { data: health } = useHealth(serverUrl)
  const showFullLogo = width >= 60 && height >= 28
  const showSmallLogo = width >= 60 && height >= 20
  const showTips = height >= 24
  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3

  return (
    <box flexDirection="column" width={width} height={height} alignItems="center" justifyContent="center">
      {showFullLogo && (
        <>
          <ascii-font text="SCODE" font="huge" color={theme.brand.primary} />
          <text fg={theme.text.muted}>Local AI Coding Assistant</text>
          <box height={1} />
        </>
      )}
      {!showFullLogo && showSmallLogo && (
        <>
          <ascii-font text="SCODE" font="block" color={theme.brand.primary} />
          <text fg={theme.text.muted}>Local AI Coding Assistant</text>
          <box height={1} />
        </>
      )}
      {!showSmallLogo && (
        <>
          <text fg={theme.brand.primary}><strong>SCode</strong></text>
          <text fg={theme.text.muted}>Local AI Coding Assistant</text>
          <box height={1} />
        </>
      )}
      <box flexDirection="row" justifyContent="center" paddingBottom={1}>
        <text fg={health?.healthy ? theme.success : theme.danger}>
          {health?.healthy ? "● Connected" : "○ Connecting..."}
        </text>
        {health?.healthy && (
          <text fg={theme.text.muted} paddingLeft={2}>
            {health.defaultProvider}/{health.defaultModel}
          </text>
        )}
      </box>
      <Composer onSubmit={onSubmit} streaming={streaming} width={width} lines={composerLines} modelDisplay={modelDisplay} />
      <KeyboardHints />
      <TipSection show={showTips} />
    </box>
  )
}
