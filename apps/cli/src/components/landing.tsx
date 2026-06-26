import { useHealth } from "../hooks/useApi";
import { useAppStore } from "../store/index";
import { Composer } from "./composer";
import { KeyboardHints } from "./keyboard-hints";
import { TipSection } from "./tip-section";

import { theme } from "@scode/theme";

interface LandingProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  height: number;
  modelDisplay?: string;
}

function parseModelString(
  modelStr: string,
): { providerId: string; modelId: string } | null {
  const idx = modelStr.indexOf("/");
  if (idx === -1) return null;
  return {
    providerId: modelStr.slice(0, idx),
    modelId: modelStr.slice(idx + 1),
  };
}

function formatModelName(modelId: string): string {
  return modelId
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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
  const modelName = parsed ? formatModelName(parsed.modelId) : "";
  const providerName = parsed ? parsed.providerId : "";

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
        {health?.healthy && modelName && (
          <text paddingLeft={2}>
            <text fg={theme.text.primary}>
              <strong>{modelName}</strong>
            </text>
            {providerName && <text fg={theme.text.muted}> {providerName}</text>}
            <text fg={theme.warning}> {effortLevel}</text>
          </text>
        )}
      </box>
      <Composer
        onSubmit={onSubmit}
        streaming={streaming}
        width={80}
        lines={composerLines}
        modelDisplay={modelDisplay}
      />
      <KeyboardHints />
      <TipSection show={showTips} />
      <text fg={health?.healthy ? theme.success : theme.danger} marginTop={1}>
        {health?.healthy ? "● Connected" : "○ Connecting..."}
      </text>
    </box>
  );
}
