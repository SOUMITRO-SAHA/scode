import { Composer } from "@/components/composer/index.js";
import { KeyboardHints } from "@/components/feedback/keyboard-hints";
import { TipSection } from "@/components/feedback/tip-section";
import { useHealth } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { formatModelName, parseModelString } from "@scode/shared/utils";
import { layout, theme } from "@scode/theme";

interface LandingProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  height: number;
  modelDisplay?: string;
  mainContentWidth: number;
  clearTrigger?: number;
}

export function Landing({
  onSubmit,
  streaming,
  height,
  modelDisplay,
  mainContentWidth,
  clearTrigger,
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
      <Composer
        onSubmit={onSubmit}
        streaming={streaming}
        width={Math.min(mainContentWidth, layout.content.promptMaxWidth)}
        lines={composerLines}
        modelDisplay={modelDisplay}
        serverUrl={serverUrl}
        clearTrigger={clearTrigger}
      />
      <KeyboardHints />
      <TipSection show={showTips} />
      <text fg={health?.healthy ? theme.success : theme.danger} marginTop={1}>
        {health?.healthy ? "● Connected" : "○ Connecting..."}
      </text>
    </box>
  );
}
