import { useCallback, useState } from "react";

import { useModels, useSetDefaultModel } from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { useKeyboard } from "@opentui/react";
import { theme } from "@scode/theme";

export function ModelSwitcher() {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const model = useAppStore((s) => s.model);
  const setModel = useAppStore((s) => s.setModel);
  const { data, isLoading } = useModels(serverUrl);
  const setDefaultModel = useSetDefaultModel(serverUrl);
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");

  const allModels = data?.models ?? [];
  const filtered = search.trim()
    ? allModels.filter((m) =>
        `${m.provider}/${m.defaultModel}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : allModels;

  const handleSelect = useCallback(
    async (modelStr: string) => {
      await setDefaultModel.mutateAsync(modelStr);
      setModel(modelStr);
      setOpen(false);
      setSearch("");
    },
    [setDefaultModel, setModel],
  );

  useKeyboard((key) => {
    if (key.name === "escape") {
      setOpen(false);
    }
  });

  if (!open) return null;

  const cols = process.stdout.columns ?? 80;
  const rows = process.stdout.rows ?? 24;
  const w = Math.min(50, cols - 10);
  const h = Math.min(filtered.length + 6, 18);

  return (
    <box
      position="absolute"
      left={Math.floor((cols - w) / 2)}
      top={Math.floor(rows / 3)}
      width={w}
      height={h}
      borderStyle="rounded"
      borderColor={theme.border.focus}
      backgroundColor={theme.background.primary}
      flexDirection="column"
    >
      <box paddingLeft={1} height={1}>
        <text fg={theme.brand.primary}>Select Model</text>
      </box>
      {!model && (
        <box paddingLeft={1} height={1}>
          <text fg={theme.warning}>No model selected</text>
        </box>
      )}
      <input
        value={search}
        onChange={(v: string) => setSearch(v)}
        placeholder="Search models..."
        width={w - 2}
        focused
      />
      <box flexDirection="column" flexGrow={1}>
        {isLoading && (
          <text fg={theme.text.muted} paddingLeft={1}>
            Loading...
          </text>
        )}
        {filtered.length === 0 && !isLoading && (
          <text fg={theme.text.muted} paddingLeft={1}>
            {search ? "No matching models" : "No models available"}
          </text>
        )}
        {filtered.slice(0, 12).map((m) => {
          const modelStr = `${m.provider}/${m.defaultModel}`;
          const active = modelStr === model;
          return (
            <box
              key={modelStr}
              height={1}
              paddingLeft={1}
              backgroundColor={active ? theme.background.hover : "transparent"}
            >
              <box onMouseDown={() => handleSelect(modelStr)}>
                <text fg={active ? theme.brand.primary : theme.text.primary}>
                  {active ? ">" : " "} {modelStr}
                </text>
              </box>
              <text fg={theme.text.muted}> ({m.providerName})</text>
            </box>
          );
        })}
      </box>
    </box>
  );
}
