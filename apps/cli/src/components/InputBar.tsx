import { theme } from "../styles/theme.js"

interface InputBarProps {
  prompt: string
  onInput: (value: string) => void
  onSubmit: (value: string) => void
  loading: boolean
  width: number
}

export function InputBar({ prompt, onInput, onSubmit, loading, width }: InputBarProps) {
  return (
    <box height={1} backgroundColor={theme.headerBg} paddingLeft={1}>
      <text fg={theme.assistant}><strong>  {"> "}</strong></text>
      <input
        value={prompt}
        onInput={onInput}
        onSubmit={onSubmit as any}
        placeholder={loading ? "Waiting..." : "Type your prompt..."}
        width={width - 4}
        focused
      />
    </box>
  )
}
