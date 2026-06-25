import { theme } from "@scode/theme"

export function KeyboardHints() {
  return (
    <box flexDirection="row" justifyContent="center" paddingTop={1}>
      <text fg={theme.text.disabled}>  /help    ctrl+l clear    ctrl+d debug    ctrl+c quit</text>
    </box>
  )
}
