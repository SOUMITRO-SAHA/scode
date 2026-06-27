import { useCallback, useEffect, useRef, useState } from "react";

import { AutocompleteDropdown } from "./autocomplete-dropdown.js";
import { ComposerFooter } from "./composer-footer.js";
import { calculateLayout, parseModelDisplay } from "./layout.js";
import { SkillPills } from "./skill-pills.js";
import { useAutocomplete } from "./useAutocomplete.js";
import { useHistory } from "./useHistory.js";

import type { Command } from "@/components/commands/commands.js";
import { AGENT_LABELS, useAppStore } from "@/store/index";
import {
  type KeyEvent,
  TextAttributes,
  type TextareaRenderable,
} from "@opentui/core";
import { theme, layout as themeLayout } from "@scode/theme";

export interface ComposerProps {
  onSubmit: (value: string) => void;
  streaming: boolean;
  width?: number;
  lines?: number;
  placeholder?: string;
  modelDisplay?: string;
  serverUrl?: string;
  focusTrigger?: number;
  clearTrigger?: number;
  prefill?: string;
  containerWidth?: number;
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
  focusTrigger,
  clearTrigger,
  prefill,
  containerWidth,
}: ComposerProps) {
  const [composerKey, setComposerKey] = useState(0);
  const [initialVal, setInitialVal] = useState("");
  const ref = useRef<TextareaRenderable | null>(null);
  const clearTriggerRef = useRef(clearTrigger);
  const prefillRef = useRef(prefill);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const cycleAgent = useAppStore((s) => s.cycleAgent);
  const effortLevel = useAppStore((s) => s.effortLevel);
  const selectedSkills = useAppStore((s) => s.selectedSkills);
  const removeSelectedSkill = useAppStore((s) => s.removeSelectedSkill);
  const clearSelectedSkills = useAppStore((s) => s.clearSelectedSkills);
  const [autoVisible, setAutoVisible] = useState(false);
  const [autoQuery, setAutoQuery] = useState("");
  const [autoIdx, setAutoIdx] = useState(0);
  const [inputMode, setInputMode] = useState<"keyboard" | "mouse">("keyboard");
  const skipSubmitRef = useRef(false);

  const { modelName, providerName, hasModel } = parseModelDisplay(modelDisplay);

  useEffect(() => {
    if (focusTrigger && ref.current && !ref.current.isDestroyed) {
      ref.current.focus();
    }
  }, [focusTrigger]);

  useEffect(() => {
    if (clearTriggerRef.current !== clearTrigger) {
      clearTriggerRef.current = clearTrigger;
      setInitialVal("");
      setComposerKey((c) => c + 1);
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (prefill && prefill !== prefillRef.current) {
      prefillRef.current = prefill;
      setInitialVal(prefill);
      setComposerKey((c) => c + 1);
    }
  }, [prefill]);
  const { items, categories, maxNameLen } = useAutocomplete({
    query: autoQuery,
    serverUrl,
  });
  const { goHistory, pushToHistory } = useHistory({
    textareaRef: ref,
    setInitialVal,
    setComposerKey,
  });

  const effectiveWidth = width ?? containerWidth;
  const layout = calculateLayout(effectiveWidth ?? 80);

  function handleAutoSelect(cmd: Command) {
    setAutoVisible(false);
    setAutoQuery("");
    setAutoIdx(0);
    onSubmit(`/${cmd.name}`);
    setInitialVal("");
    setComposerKey((c) => c + 1);
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
      if (event.name === "backspace") {
        const ta = ref.current;
        const val = (ta?.plainText ?? "").trim();
        if (val === "" && selectedSkills.length > 0) {
          removeSelectedSkill(selectedSkills[selectedSkills.length - 1]);
          return;
        }
      }
    },
    [
      autoVisible,
      items,
      autoIdx,
      goHistory,
      cycleAgent,
      selectedSkills,
      removeSelectedSkill,
    ],
  );

  const handleSubmit = useCallback(() => {
    if (skipSubmitRef.current) {
      skipSubmitRef.current = false;
      return;
    }
    const ta = ref.current;
    const val = (ta?.plainText ?? "").trim();
    if (!val || streaming) return;
    const skillPrefix = selectedSkills.map((s) => `@{skill: ${s}}`).join(" ");
    const fullVal = skillPrefix ? `${skillPrefix} ${val}` : val;
    pushToHistory(fullVal);
    onSubmit(fullVal);
    clearSelectedSkills();
    setInitialVal("");
    setComposerKey((c) => c + 1);
  }, [onSubmit, streaming, pushToHistory, selectedSkills, clearSelectedSkills]);

  const isCommand = initialVal.trim().startsWith("/");
  const hasActiveSkills = selectedSkills.length > 0;

  return (
    <box
      paddingBottom={2}
      paddingLeft={1}
      paddingRight={1}
      width={effectiveWidth}
      alignItems="center"
    >
      <box
        borderStyle="rounded"
        borderColor={
          isCommand
            ? theme.brand.primary
            : hasActiveSkills
              ? theme.brand.primary
              : AGENT_COLORS[currentAgent]
        }
        width="100%"
        flexDirection="column"
      >
        <SkillPills skills={selectedSkills} />
        <box paddingLeft={1} flexDirection="column">
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
        </box>
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
