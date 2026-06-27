import { useCallback, useMemo, useState } from "react";

import { DialogSelect, type DialogSelectOption } from "@/components/ui/dialog";
import { useModels, useProviders, useSetDefaultModel } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

export function ModelSwitcher({ onClose }: { onClose?: () => void }) {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const model = useAppStore((s) => s.model);
  const setModel = useAppStore((s) => s.setModel);
  const { data, isLoading } = useModels(serverUrl);
  const { data: providersData } = useProviders(serverUrl);
  const setDefaultModel = useSetDefaultModel(serverUrl);
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  useKeyboard((event: KeyEvent) => {
    if (!open) return;
    if (event.name === "escape") {
      handleClose();
    }
  });

  const handleSelect = useCallback(
    async (option: DialogSelectOption<string>) => {
      const modelStr = option.value;
      await setDefaultModel.mutateAsync(modelStr);
      setModel(modelStr);
      handleClose();
    },
    [setDefaultModel, setModel, handleClose],
  );

  const options = useMemo((): DialogSelectOption<string>[] => {
    if (!data?.models) return [];
    const connectedProviders = new Set(
      providersData?.providers.filter((p) => p.connected).map((p) => p.id) ??
        [],
    );
    return data.models
      .filter((m) => connectedProviders.has(m.provider))
      .map((m) => {
        const modelStr = `${m.provider}/${m.defaultModel}`;
        return {
          title: m.defaultModel,
          description: m.providerName,
          category: m.providerName,
          value: modelStr,
          truncateTitle: false,
        };
      });
  }, [data, providersData]);

  if (!open) return null;

  const paletteWidth = Math.min(Math.floor(termWidth * 0.6), 64);

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width={termWidth}
      height={termHeight}
      alignItems="center"
      paddingTop={Math.floor(termHeight / 4)}
      zIndex={3000}
      flexDirection="column"
    >
      <box
        width={paletteWidth}
        maxWidth={termWidth - 2}
        backgroundColor={theme.background.surface}
        borderStyle="rounded"
        borderColor={theme.border.focus}
        paddingTop={1}
        flexDirection="column"
      >
        <DialogSelect
          title="Select Model"
          placeholder="Search models..."
          options={options}
          flat
          current={model}
          onSelect={handleSelect}
          onClose={handleClose}
          footer={<text fg={theme.text.disabled}>↑↓ navigate</text>}
          footerHints={[{ title: "↵", label: "select", side: "right" }]}
          emptyView={
            <box paddingLeft={4} paddingRight={4} paddingTop={1}>
              <text fg={theme.text.muted}>
                {isLoading ? "Loading models..." : "No models available"}
              </text>
            </box>
          }
        />
      </box>
    </box>
  );
}
