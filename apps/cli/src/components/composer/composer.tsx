import { useCallback, useRef, useState } from "react";

import { AutocompleteDropdown } from "./autocomplete-dropdown.js";
import { ComposerFooter } from "./composer-footer.js";
import { calculateLayout, parseModelDisplay } from "./layout.js";
import { useAutocomplete } from "./useAutocomplete.js";
import { useHistory } from "./useHistory.js";

import type { Command } from "@/components/commands/commands.js";
import { AGENT_LABELS, useAppStore } from "@/store/index";
import {
  type KeyEvent,
  TextAttributes,
  type TextareaRenderable,
} from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { theme } from "@scode/theme";

export interface ComposerProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  width: number;
  lines?: number;
  placeholder?: string;
  modelDisplay?: string;
  serverUrl?: string;
}

const AGENT_COLORS: Record<string, string> = {
  plan: theme.warning,
  write: theme.success,
  chat: theme.brand.primary,
};

export function Composer({
  onSubmit,
  streaming,
  width,
  lines = 3,
  placeholder = "Ask anything...",
  modelDisplay,
  serverUrl,
}: ComposerProps) {
  const [composerKey, setComposerKey] = useState(0);
  const [initialVal, setInitialVal] = useState("");
  const ref = useRef<TextareaRenderable | null>(null);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const cycleAgent = useAppStore((s) => s.cycleAgent);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const [autoVisible, setAutoVisible] = useState(false);
  const [autoQuery, setAutoQuery] = useState("");
  const [autoIdx, setAutoIdx] = useState(0);
  const [inputMode, setInputMode] = useState<"keyboard" | "mouse">("keyboard");
  const skipSubmitRef = useRef(false);
  const { width: termWidth } = useTerminalDimensions();

  const { modelName, providerName, hasModel } = parseModelDisplay(modelDisplay);
  const { items, categories, maxNameLen } = useAutocomplete({
    query: autoQuery,
    serverUrl,
  });
  const { goHistory, pushToHistory } = useHistory({
    textareaRef: ref,
    setInitialVal,
    setComposerKey,
  });

  const layout = calculateLayout(termWidth);

  function handleAutoSelect(cmd: Command) {
    const ta = ref.current!;
    const newText = `/${cmd.name} `;
    const cursor = ta.logicalCursor;
    ta.deleteRange(0, 0, cursor.row, cursor.col);
    ta.insertText(newText);
    ta.cursorOffset = newText.length;
    setAutoVisible(false);
    setAutoQuery("");
    setAutoIdx(0);
  }

  const handleKeyDown = useCallback(
    (event: KeyEvent) => {
      if (autoVisible && items.length > 0) {
        if (event.name === "down") {
          setInputMode("keyboard");
          setAutoIdx((i) => (i + 1) % items.length);
          return;
        }
        if (event.name === "up") {
          setInputMode("keyboard");
          setAutoIdx((i) => (i - 1 + items.length) % items.length);
          return;
        }
        if (event.name === "return" || event.name === "tab") {
          const cmd = items[autoIdx];
          if (cmd) {
            skipSubmitRef.current = true;
            handleAutoSelect(cmd);
          }
          return;
        }
        if (event.name === "escape") {
          setAutoVisible(false);
          setAutoQuery("");
          setAutoIdx(0);
          return;
        }
      }
      if (event.name === "up") {
        goHistory(-1);
        return;
      }
      if (event.name === "down") {
        goHistory(1);
        return;
      }
      if (event.name === "tab") {
        cycleAgent();
        return;
      }
    },
    [autoVisible, items, autoIdx, goHistory, cycleAgent],
  );

  const handleSubmit = useCallback(() => {
    if (skipSubmitRef.current) {
      skipSubmitRef.current = false;
      return;
    }
    const ta = ref.current;
    const val = (ta?.plainText ?? "").trim();
    if (!val || streaming) return;
    pushToHistory(val);
    onSubmit(val);
    setInitialVal("");
    setComposerKey((c) => c + 1);
  }, [onSubmit, streaming, pushToHistory]);

  const isCommand = initialVal.trim().startsWith("/");

  return (
    <box
      paddingLeft={layout.borderPad}
      paddingRight={layout.borderPad}
      paddingBottom={1}
    >
      <box
        borderStyle="rounded"
        borderColor={
          isCommand ? theme.brand.primary : AGENT_COLORS[currentAgent]
        }
        width={layout.boxWidth}
        flexDirection="column"
      >
        <textarea
          key={composerKey}
          ref={ref}
          initialValue={initialVal}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          onContentChange={() => {
            if (streaming) return;
            const ta = ref.current;
            const val = ta?.plainText ?? "";
            if (val.startsWith("/")) {
              const afterSlash = val.slice(1);
              if (!afterSlash.includes(" ")) {
                setAutoQuery(afterSlash);
                setAutoIdx(0);
                if (!autoVisible) setAutoVisible(true);
                return;
              }
              if (afterSlash.includes(" ") && afterSlash.trim().length > 0) {
                const cmdPart = afterSlash.split(" ")[0];
                const matchingCmd = items.find(
                  (c) => c.name === cmdPart || c.aliases.includes(cmdPart),
                );
                if (matchingCmd) {
                  setAutoVisible(false);
                  setAutoQuery("");
                  return;
                }
              }
            }
            if (autoVisible) {
              setAutoVisible(false);
              setAutoQuery("");
            }
          }}
          placeholder={streaming ? "Waiting..." : placeholder}
          width={layout.inputWidth}
          height={lines}
          focused
          keyBindings={[{ name: "return", action: "submit" }]}
          backgroundColor="transparent"
          focusedBackgroundColor="transparent"
          textColor={theme.text.primary}
          placeholderColor={theme.text.disabled}
        />
        {autoVisible && (
          <AutocompleteDropdown
            items={items}
            maxNameLen={maxNameLen}
            selectedIndex={autoIdx}
            width={layout.autoWidth}
            onSelect={handleAutoSelect}
            onMouseMove={() => setInputMode("mouse")}
          />
        )}
        <ComposerFooter
          isCommand={isCommand}
          currentAgent={currentAgent}
          effortLevel={effortLevel}
          modelName={modelName}
          providerName={providerName}
          hasModel={hasModel}
          streaming={streaming}
        />
      </box>
    </box>
  );
}
