import { useTips } from "../hooks/useTips";
import { Icon } from "./icon";

import { theme } from "@scode/theme";

export function TipSection({ show = true }: { show?: boolean }) {
  const tip = useTips();
  if (!show) return null;
  return (
    <box
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      paddingTop={1}
    >
      <Icon name="lightbulb" color={theme.warning} padRight={1} />
      <text fg={theme.text.muted}>{tip}</text>
    </box>
  );
}
