import { theme } from "@scode/theme";

export function KeyboardHints() {
  return (
    <box flexDirection="row" justifyContent="center" paddingTop={1}>
      <text fg={theme.text.disabled}>
        Tab Agent /help Ctrl+P Palette Ctrl+L Clear Ctrl+D Debug Ctrl+S Sessions
        Ctrl+C Quit
      </text>
    </box>
  );
}
