import { Effect, Option } from "effect";

import { Composer } from "@/components/composer/index";
import { KeyboardHints } from "@/components/feedback/keyboard-hints";
import { TipSection } from "@/components/feedback/tip-section";
import { useConnectionStatus, useHealth } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import type { TextareaRenderable } from "@opentui/core";
import { formatModelName, parseModelString } from "@scode/shared/utils";
import { layout, theme } from "@scode/theme";

interface LandingProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  height: number;
  modelDisplay?: string;
  mainContentWidth: number;
  clearTrigger?: number;
  focusTrigger?: number;
  textareaRef?: React.RefObject<TextareaRenderable | null>;
}

export function Landing({
  onSubmit,
  streaming,
  height,
  modelDisplay,
  mainContentWidth,
  clearTrigger,
  focusTrigger,
  textareaRef,
}: LandingProps) {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const model = useAppStore((s) => s.model);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const { data: health } = useHealth(serverUrl);
  const { status } = useConnectionStatus(serverUrl);
  const showLogo = height >= 20;
  const showTips = height >= 24;
  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3;

  const modelStr = model ?? modelDisplay ?? health?.defaultModel;
  const parsed = modelStr
    ? Option.getOrNull(
        Effect.runSync(Effect.option(parseModelString(modelStr))),
      )
    : null;
  const modelName = parsed ? Effect.runSync(formatModelName(parsed.model)) : "";
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
        focusTrigger={focusTrigger}
        textareaRef={textareaRef}
      />
      <KeyboardHints />
      <TipSection show={showTips} />
      <text
        fg={
          status === "initializing"
            ? theme.warning
            : status === "connected"
              ? theme.success
              : theme.danger
        }
        marginTop={1}
      >
        {status === "initializing"
          ? "◌ Initializing..."
          : status === "connected"
            ? "● Server Connected"
            : "○ Connection Failed"}
      </text>
    </box>
  );
}
