import { theme } from "../styles/theme.js"

export function KeyboardHints() {
  return (
    <box flexDirection="row" justifyContent="center" paddingTop={1}>
      <text fg={theme.dim}>  /help    ctrl+l clear    ctrl+d debug    ctrl+c quit</text>
    </box>
  )
}
