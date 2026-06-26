import { useCallback, useMemo, useRef, useState } from "react";

import fuzzysort from "fuzzysort";

import { COMMANDS } from "../commands/commands";
import { AGENT_LABELS, useAppStore } from "../store/index";

import type { KeyEvent, TextareaRenderable } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { formatModelName, parseModelString } from "@scode/shared/utils";
import { theme } from "@scode/theme";

interface ComposerProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  width: number;
  lines?: number;
  placeholder?: string;
  modelDisplay?: string;
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
}: ComposerProps) {
  const boxWidth = Math.min(width - 4, 80);
  const inputWidth = boxWidth - 4;
  const borderPad = Math.max(0, Math.floor((width - boxWidth) / 2));
  const [composerKey, setComposerKey] = useState(0);
  const [initialVal, setInitialVal] = useState("");
  const ref = useRef<TextareaRenderable | null>(null);
  const historyRef = useRef<string[]>([]);
  const draftRef = useRef("");
  const histIdxRef = useRef(-1);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const cycleAgent = useAppStore((s) => s.cycleAgent);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const [autoVisible, setAutoVisible] = useState(false);
  const [autoQuery, setAutoQuery] = useState("");
  const [autoIdx, setAutoIdx] = useState(0);
  const { width: termWidth } = useTerminalDimensions();

  const modelStr = modelDisplay;
  const parsed = modelStr ? parseModelString(modelStr) : null;
  const modelName = parsed ? formatModelName(parsed.model) : "";
  const providerName = parsed?.providerId ?? "";
  const hasModel = !!modelName;

  const filtered = useMemo(() => {
    if (!autoQuery) return COMMANDS;
    return fuzzysort
      .go(autoQuery, COMMANDS, {
        keys: ["name", (c) => c.aliases.join(" "), "description", "category"],
        limit: 10,
      })
      .map((r) => r.obj);
  }, [autoQuery]);

  const categories = useMemo(
    () => [...new Set(filtered.map((c) => c.category))],
    [filtered],
  );

  const maxNameLen = useMemo(
    () => Math.max(...filtered.map((c) => c.name.length), 0),
    [filtered],
  );

  const goHistory = useCallback((dir: -1 | 1) => {
    const ta = ref.current as any;
    const hist = historyRef.current;
    if (hist.length === 0) return;
    if (dir === -1) {
      if (histIdxRef.current === -1)
        draftRef.current = ta?.plainText ?? ta?.value ?? "";
      if (histIdxRef.current < hist.length - 1) {
        histIdxRef.current++;
        setInitialVal(hist[hist.length - 1 - histIdxRef.current]);
        setComposerKey((c) => c + 1);
      }
    } else {
      if (histIdxRef.current === -1) return;
      if (histIdxRef.current === 0) {
        histIdxRef.current = -1;
        setInitialVal(draftRef.current);
      } else {
        histIdxRef.current--;
        setInitialVal(hist[hist.length - 1 - histIdxRef.current]);
      }
      setComposerKey((c) => c + 1);
    }
  }, []);

  function handleAutoSelect(name: string) {
    const ta = ref.current as any;
    const newText = `/${name} `;
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
      if (autoVisible && filtered.length > 0) {
        if (event.name === "down") {
          setAutoIdx((i) => Math.min(i + 1, filtered.length - 1));
          return;
        }
        if (event.name === "up") {
          setAutoIdx((i) => Math.max(i - 1, 0));
          return;
        }
        if (event.name === "return" || event.name === "tab") {
          const cmd = filtered[autoIdx];
          if (cmd) handleAutoSelect(cmd.name);
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
    [autoVisible, filtered, autoIdx, goHistory, cycleAgent],
  );

  const handleSubmit = useCallback(() => {
    if (autoVisible) return;
    const ta = ref.current as any;
    const val = (ta?.plainText ?? ta?.value ?? "").trim();
    if (!val || streaming) return;
    historyRef.current.push(val);
    histIdxRef.current = -1;
    draftRef.current = "";
    onSubmit(val);
    setInitialVal("");
    setComposerKey((c) => c + 1);
  }, [onSubmit, streaming, autoVisible]);

  const isCommand = initialVal.trim().startsWith("/");
  const autoHeight = Math.min(filtered.length + categories.length + 1, 12);
  const autoWidth = Math.min(boxWidth - 2, 56);

  return (
    <box paddingLeft={borderPad} paddingRight={borderPad} paddingBottom={1}>
      <box
        borderStyle="rounded"
        borderColor={
          isCommand ? theme.brand.primary : AGENT_COLORS[currentAgent]
        }
        width={boxWidth}
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
            const ta = ref.current as any;
            const val = ta?.plainText ?? ta?.value ?? "";
            if (val.startsWith("/")) {
              const afterSlash = val.slice(1);
              if (!afterSlash.includes(" ")) {
                setAutoQuery(afterSlash);
                setAutoIdx(0);
                if (!autoVisible) setAutoVisible(true);
                return;
              }
            }
            if (autoVisible) {
              setAutoVisible(false);
              setAutoQuery("");
            }
          }}
          placeholder={streaming ? "Waiting..." : placeholder}
          width={inputWidth}
          height={lines}
          focused
          keyBindings={[{ name: "return", action: "submit" }]}
          backgroundColor="transparent"
          focusedBackgroundColor="transparent"
          textColor={theme.text.primary}
          placeholderColor={theme.text.disabled}
        />
        {autoVisible && (
          <box
            position="absolute"
            top={-autoHeight - 1}
            left={1}
            width={autoWidth}
            height={autoHeight}
            borderStyle="rounded"
            borderColor={theme.border.focus}
            backgroundColor={theme.background.surface}
            flexDirection="column"
          >
            <scrollbox flexGrow={1} flexDirection="column">
              {filtered.length === 0 && (
                <box height={2} justifyContent="center" alignItems="center">
                  <text fg={theme.text.disabled}>No matching commands</text>
                </box>
              )}
              {categories.map((cat, catIdx) => {
                const catCmds = filtered.filter((c) => c.category === cat);
                if (catCmds.length === 0) return null;
                return (
                  <box key={cat} flexDirection="column">
                    <box
                      height={1}
                      paddingLeft={1}
                      paddingTop={catIdx > 0 ? 1 : 0}
                    >
                      <text fg={theme.brand.primary}>{cat}</text>
                    </box>
                    {catCmds.map((cmd) => {
                      const idx = filtered.indexOf(cmd);
                      return (
                        <box
                          key={cmd.name}
                          height={1}
                          paddingLeft={2}
                          backgroundColor={
                            idx === autoIdx
                              ? theme.background.hover
                              : "transparent"
                          }
                        >
                          <text
                            fg={
                              idx === autoIdx
                                ? theme.text.primary
                                : theme.text.muted
                            }
                          >
                            {`/${cmd.name}`.padEnd(maxNameLen + 2)}
                          </text>
                          <text
                            fg={
                              idx === autoIdx
                                ? theme.text.primary
                                : theme.text.muted
                            }
                          >
                            {cmd.description}
                          </text>
                        </box>
                      );
                    })}
                  </box>
                );
              })}
            </scrollbox>
          </box>
        )}
        <box height={1} paddingLeft={1}>
          {isCommand ? (
            <text fg={theme.brand.primary}>Command</text>
          ) : (
            <box flexDirection="row">
              <text fg={AGENT_COLORS[currentAgent]}>
                {AGENT_LABELS[currentAgent]}
              </text>
              <text fg={theme.text.disabled}> · </text>
              {hasModel ? (
                <>
                  <text fg={theme.text.primary}>{modelName}</text>
                  {providerName && (
                    <text fg={theme.text.muted}> {providerName}</text>
                  )}
                </>
              ) : (
                <text fg={theme.warning}>No model selected</text>
              )}
              <text fg={theme.text.disabled}> · </text>
              <text fg={theme.warning}>{effortLevel}</text>
              <text fg={theme.text.disabled}>
                {" "}
                | {streaming ? "Processing..." : "Ready"}
              </text>
            </box>
          )}
        </box>
      </box>
    </box>
  );
}
