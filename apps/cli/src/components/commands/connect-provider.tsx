import { useCallback, useMemo, useState } from "react";

import {
  DialogSelect,
  type DialogSelectOption,
  useDialog,
} from "@/components/ui/dialog";
import { DialogPrompt } from "@/components/ui/dialog-prompt";
import {
  useConnectProvider,
  useDisconnectProvider,
  useProviders,
  useSetDefaultProvider,
} from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { ProviderInfo } from "@scode/shared/types";
import { theme } from "@scode/theme";

export function ConnectProvider() {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const setModel = useAppStore((s) => s.setModel);
  const { data, isLoading } = useProviders(serverUrl);
  const connectProvider = useConnectProvider(serverUrl);
  const disconnectProvider = useDisconnectProvider(serverUrl);
  const setDefaultProvider = useSetDefaultProvider(serverUrl);
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  const [open, setOpen] = useState(true);
  const dialog = useDialog();

  useKeyboard((event: KeyEvent) => {
    if (!open) return;
    if (event.name === "escape") {
      setOpen(false);
    }
  });

  const handleConnect = useCallback(
    async (provider: ProviderInfo) => {
      const apiKey = await DialogPrompt.show(
        dialog,
        `API Key: ${provider.name}`,
        {
          placeholder: "Enter your API key",
          description: (
            <text fg={theme.text.muted}>
              API key required for {provider.name}
            </text>
          ),
        },
      );
      if (!apiKey) return;
      try {
        await connectProvider.mutateAsync({
          provider: provider.id,
          apiKey,
        });
        useAppStore
          .getState()
          .addSystemMessage(`Connected to ${provider.name}`);
      } catch (err) {
        useAppStore
          .getState()
          .addSystemMessage(`Failed to connect: ${(err as Error).message}`);
      }
    },
    [dialog, connectProvider],
  );

  const handleDisconnect = useCallback(
    async (provider: ProviderInfo) => {
      try {
        await disconnectProvider.mutateAsync(provider.id);
        useAppStore
          .getState()
          .addSystemMessage(`Disconnected from ${provider.name}`);
      } catch (err) {
        useAppStore
          .getState()
          .addSystemMessage(`Failed to disconnect: ${(err as Error).message}`);
      }
    },
    [disconnectProvider],
  );

  const handleSetDefault = useCallback(
    async (provider: ProviderInfo) => {
      try {
        const result = await setDefaultProvider.mutateAsync(provider.id);
        setModel(`${result.provider}/${result.defaultModel}`);
        useAppStore
          .getState()
          .addSystemMessage(`Default provider: ${provider.name}`);
      } catch (err) {
        useAppStore
          .getState()
          .addSystemMessage(`Failed to set default: ${(err as Error).message}`);
      }
    },
    [setDefaultProvider, setModel],
  );

  const options = useMemo((): DialogSelectOption<string>[] => {
    if (!data?.providers) return [];
    return data.providers.map((p) => ({
      title: p.name,
      description: p.connected ? `● ${p.id}` : `○ ${p.id}`,
      value: p.id,
      truncateTitle: false,
      gutter: p.connected ? () => <text fg={theme.success}>●</text> : undefined,
    }));
  }, [data]);

  const defaultProvider = data?.default;

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
          title="Connect Provider"
          placeholder="Search providers..."
          options={options}
          flat
          current={defaultProvider}
          onSelect={async (option) => {
            const provider = data?.providers.find((p) => p.id === option.value);
            if (!provider) return;
            if (provider.connected) {
              await handleDisconnect(provider);
            } else {
              await handleConnect(provider);
            }
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          actions={[
            {
              command: "c",
              title: "connect",
              side: "left",
              disabled: (opt) => {
                const p = data?.providers.find((x) => x.id === opt?.value);
                return !p || !!p.connected;
              },
              onTrigger: async (option) => {
                const provider = data?.providers.find(
                  (p) => p.id === option.value,
                );
                if (provider) await handleConnect(provider);
                setOpen(false);
              },
            },
            {
              command: "d",
              title: "disconnect",
              side: "left",
              disabled: (opt) => {
                const p = data?.providers.find((x) => x.id === opt?.value);
                return !p || !p.connected;
              },

              onTrigger: async (option) => {
                const provider = data?.providers.find(
                  (p) => p.id === option.value,
                );
                if (provider) await handleDisconnect(provider);
                setOpen(false);
              },
            },
            {
              command: "s",
              title: "set default",
              side: "left",
              onTrigger: async (option) => {
                const provider = data?.providers.find(
                  (p) => p.id === option.value,
                );
                if (provider) await handleSetDefault(provider);
                setOpen(false);
              },
            },
          ]}
          footer={<text fg={theme.text.disabled}>↑↓ navigate tab actions</text>}
          footerHints={[{ title: "↵", label: "select", side: "right" }]}
          emptyView={
            <box paddingLeft={4} paddingRight={4} paddingTop={1}>
              <text fg={theme.text.muted}>
                {isLoading ? "Loading providers..." : "No providers available"}
              </text>
            </box>
          }
        />
      </box>
    </box>
  );
}
