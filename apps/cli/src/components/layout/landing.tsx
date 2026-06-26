import { Composer } from "@/components/composer/index.js";
import { KeyboardHints } from "@/components/feedback/keyboard-hints";
import { TipSection } from "@/components/feedback/tip-section";
import { useHealth } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { formatModelName, parseModelString } from "@scode/shared/utils";
import { theme } from "@scode/theme";

interface LandingProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  height: number;
  modelDisplay?: string;
}

export function Landing({
  onSubmit,
  streaming,
  height,
  modelDisplay,
}: LandingProps) {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const model = useAppStore((s) => s.model);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const { data: health } = useHealth(serverUrl);
  const showLogo = height >= 20;
  const showTips = height >= 24;
  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3;

  const modelStr = model ?? modelDisplay ?? health?.defaultModel;
  const parsed = modelStr ? parseModelString(modelStr) : null;
  const modelName = parsed ? formatModelName(parsed.model) : "";
  const providerName = parsed ? parsed.providerId : "";
  const hasModel = !!modelName;

  return (
    <box
      flexDirection="column"
      width="100%"
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
    >
      {showLogo && (
        <box flexDirection="column" alignItems="center">
          <ascii-font text="SCODE" font="slick" color={theme.brand.primary} />
          <text fg={theme.text.muted}>Local AI Coding Assistant</text>
          <box height={1} />
        </box>
      )}
      {!showLogo && (
        <box flexDirection="column" alignItems="center">
          <text fg={theme.brand.primary}>
            <strong>SCode</strong>
          </text>
          <text fg={theme.text.muted}>Local AI Coding Assistant</text>
          <box height={1} />
        </box>
      )}
      <box flexDirection="row" justifyContent="center" paddingBottom={1}>
        {health?.healthy && hasModel && (
          <>
            <text fg={theme.text.primary} paddingLeft={2}>
              <strong>{modelName}</strong>
            </text>
            {providerName && <text fg={theme.text.muted}> {providerName}</text>}
            <text fg={theme.warning}> {effortLevel}</text>
          </>
        )}
        {health?.healthy && !hasModel && (
          <text fg={theme.warning} paddingLeft={2}>
            No model selected — Ctrl+M to choose
          </text>
        )}
      </box>
      <Composer
        onSubmit={onSubmit}
        streaming={streaming}
        width={80}
        lines={composerLines}
        modelDisplay={modelDisplay}
        serverUrl={serverUrl}
      />
      <KeyboardHints />
      <TipSection show={showTips} />
      <text fg={health?.healthy ? theme.success : theme.danger} marginTop={1}>
        {health?.healthy ? "● Connected" : "○ Connecting..."}
      </text>
    </box>
  );
}
