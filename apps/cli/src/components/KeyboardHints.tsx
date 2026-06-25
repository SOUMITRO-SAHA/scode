import { theme } from "../styles/theme.js"

export function KeyboardHints() {
  return (
    <box flexDirection="row" justifyContent="center" paddingTop={1}>
      <text fg={theme.dim}>
        <text>  /help    </text>
        <text>ctrl+l clear    </text>
        <text>ctrl+d debug    </text>
        <text>ctrl+c quit</text>
      </text>
    </box>
  )
}
