import { useCallback, useEffect, useRef, useState } from "react";

import {
  type Command,
  type CommandContext,
  executeCommand,
  parseCommand,
} from "./commands/commands";
import { ChatArea } from "./components/chat-area";
import { CommandPalette } from "./components/command-palette";
import { Composer } from "./components/composer";
import { Header } from "./components/header";
import { Landing } from "./components/landing";
import { ModelSwitcher } from "./components/model-switcher";
import { SessionSidebar } from "./components/session-sidebar";
import { useStreamChat } from "./hooks/useStreamChat";
import { ApiClient } from "./services/api";
import { useAppStore } from "./store/index";

import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/react";

export function App({
  serverUrl,
  model: initialModel,
}: {
  serverUrl: string;
  model?: string;
}) {
  const {
    messages,
    streaming,
    setSessionId,
    submit: chatSubmit,
  } = useStreamChat(serverUrl);
  const renderer = useRenderer();
  const { width, height } = useTerminalDimensions();

  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const model = useAppStore((s) => s.model);
  const debug = useAppStore((s) => s.debug);
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const setModel = useAppStore((s) => s.setModel);
  const setCurrentSessionId = useAppStore((s) => s.setCurrentSessionId);
  const toggleDebug = useAppStore((s) => s.toggleDebug);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const addSystemMessage = useAppStore((s) => s.addSystemMessage);
  const clearMessages = useAppStore((s) => s.clearMessages);

  useEffect(() => {
    if (serverUrl) useAppStore.getState().setServerUrl(serverUrl);
  }, [serverUrl]);

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const apiRef = useRef(new ApiClient(serverUrl));

  // Initialize model from props on first render if not set
  if (!model && initialModel) useAppStore.getState().setModel(initialModel);

  const handleSetSessionId = useCallback(
    (id: string | undefined) => {
      setSessionId(id);
      setCurrentSessionId(id);
    },
    [setSessionId, setCurrentSessionId],
  );

  const handleSetModel = useCallback(
    (m: string | undefined) => {
      setModel(m);
    },
    [setModel],
  );

  const hasConversation = messages.length > 0;
  const composerLines = height < 20 ? 1 : height < 28 ? 2 : 3;

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim() || streaming) return;

      const parsed = parseCommand(value);
      if (parsed) {
        const ctx: CommandContext = {
          model,
          serverUrl,
          currentSessionId,
          debugEnabled: debug,
          setModel: handleSetModel,
          setCurrentSessionId: handleSetSessionId,
          clearMessages,
          toggleDebug,
          addSystemMessage,
        };
        const result = await executeCommand(value, apiRef.current, ctx);
        if (result?.type === "message" && result.text) {
          addSystemMessage(result.text);
        }
        return;
      }

      chatSubmit(value);
    },
    [
      streaming,
      model,
      serverUrl,
      currentSessionId,
      debug,
      handleSetModel,
      handleSetSessionId,
      clearMessages,
      toggleDebug,
      addSystemMessage,
      chatSubmit,
    ],
  );

  const handlePaletteSelect = useCallback(
    (cmd: Command) => {
      addSystemMessage(`Running /${cmd.name}...`);
      const ctx: CommandContext = {
        model,
        serverUrl,
        currentSessionId,
        debugEnabled: debug,
        setModel: handleSetModel,
        setCurrentSessionId: handleSetSessionId,
        clearMessages,
        toggleDebug,
        addSystemMessage,
      };
      executeCommand(`/${cmd.name}`, apiRef.current, ctx);
    },
    [
      model,
      serverUrl,
      currentSessionId,
      debug,
      handleSetModel,
      handleSetSessionId,
      clearMessages,
      toggleDebug,
      addSystemMessage,
    ],
  );

  useKeyboard((key) => {
    if (key.name === "escape") {
      if (paletteVisible) setPaletteVisible(false);
      else if (modelPickerOpen) setModelPickerOpen(false);
      else if (sidebarVisible) toggleSidebar();
    } else if (key.ctrl && key.name === "p") {
      setPaletteVisible((v) => !v);
    } else if (key.ctrl && key.name === "l") {
      clearMessages();
    } else if (key.ctrl && key.name === "d") {
      toggleDebug();
    } else if (key.ctrl && key.name === "s") {
      toggleSidebar();
    } else if (key.ctrl && key.name === "m") {
      setModelPickerOpen((v) => !v);
    } else if (key.ctrl && (key.name === "c" || key.name === "q")) {
      renderer.destroy();
      process.exit(0);
    }
  });

  const modelDisplay = model;

  return (
    <box flexDirection="row" width={width} height={height}>
      <SessionSidebar />
      <box flexDirection="column" flexGrow={1}>
        {hasConversation && <Header modelDisplay={modelDisplay} />}
        {hasConversation ? (
          <ChatArea messages={messages} streaming={streaming} />
        ) : (
          <Landing
            onSubmit={handleSubmit}
            streaming={streaming}
            height={height}
            modelDisplay={modelDisplay}
          />
        )}
        {hasConversation && (
          <Composer
            onSubmit={handleSubmit}
            streaming={streaming}
            width={width}
            lines={composerLines}
            placeholder={streaming ? "Waiting..." : "Ask anything..."}
            modelDisplay={modelDisplay}
          />
        )}
        <CommandPalette
          visible={paletteVisible}
          onClose={() => setPaletteVisible(false)}
          onSelect={handlePaletteSelect}
        />
        {modelPickerOpen && <ModelSwitcher />}
      </box>
    </box>
  );
}
