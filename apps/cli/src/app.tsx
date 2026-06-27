import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type Command,
  type CommandContext,
  executeCommand,
  parseCommand,
} from "@/components/commands/commands.js";
import { MainContent, SessionSidebar } from "@/components/layout/index.js";
import { DialogProvider } from "@/components/ui/dialog";
import { Toast, ToastProvider, useToast } from "@/components/ui/toast";
import { useHealth, useSessions } from "@/hooks/useApi";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts.js";
import { useStreamChat } from "@/hooks/useStreamChat";
import { ApiClient } from "@/services/api";
import { useAppStore } from "@/store/index";
import { useTerminalDimensions } from "@opentui/react";
import { apiFetch } from "@scode/shared/utils";
import { layout, theme } from "@scode/theme";

export function App({
  serverUrl,
  model: initialModel,
  onExit,
}: {
  serverUrl: string;
  model?: string;
  onExit?: () => void;
}) {
  return (
    <DialogProvider>
      <ToastProvider>
        <AppInner
          serverUrl={serverUrl}
          initialModel={initialModel}
          onExit={onExit}
        />
        <Toast />
      </ToastProvider>
    </DialogProvider>
  );
}

function AppInner({
  serverUrl,
  initialModel,
  onExit,
}: {
  serverUrl: string;
  initialModel?: string;
  onExit?: () => void;
}) {
  const toast = useToast();
  const {
    messages,
    streaming,
    setSessionId,
    submit: chatSubmit,
  } = useStreamChat(serverUrl);
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

  const { data: sessionsData } = useSessions(serverUrl);
  const sessions = sessionsData?.sessions ?? [];
  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId),
    [sessions, currentSessionId],
  );
  const sessionName = currentSession?.name;

  useEffect(() => {
    if (serverUrl) useAppStore.getState().setServerUrl(serverUrl);
  }, [serverUrl]);

  // Load last used model from server on init (if no model set via CLI args)
  const { data: healthData } = useHealth(serverUrl);
  useEffect(() => {
    if (healthData?.defaultModel && !model) {
      setModel(healthData.defaultModel);
    }
  }, [healthData, model, setModel]);

  // Persist model changes to the current session in the backend
  useEffect(() => {
    if (currentSessionId && model && serverUrl) {
      apiFetch(
        `/sessions/${encodeURIComponent(currentSessionId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ model }),
        },
        serverUrl,
      ).catch(() => {});
    }
  }, [model, currentSessionId, serverUrl]);

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [providerPickerOpen, setProviderPickerOpen] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const bumpFocus = useCallback(() => setFocusTrigger((n) => n + 1), []);
  const handleOpenModelPicker = useCallback(() => setModelPickerOpen(true), []);
  const handleOpenProviderPicker = useCallback(
    () => setProviderPickerOpen(true),
    [],
  );
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
          openModelPicker: handleOpenModelPicker,
          openProviderPicker: handleOpenProviderPicker,
          addSystemMessage,
          showToast: toast.show,
          onExit,
        };
        const result = await executeCommand(value, apiRef.current, ctx);
        if (result) {
          if (result.type === "message" && result.text) {
            addSystemMessage(result.text);
          } else if (result.type === "error" && result.text) {
            toast.show({ variant: "error", message: result.text });
          }
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
      handleOpenModelPicker,
      handleOpenProviderPicker,
      addSystemMessage,
      toast,
      chatSubmit,
    ],
  );

  const handlePaletteSelect = useCallback(
    async (cmd: Command) => {
      const ctx: CommandContext = {
        model,
        serverUrl,
        currentSessionId,
        debugEnabled: debug,
        setModel: handleSetModel,
        setCurrentSessionId: handleSetSessionId,
        clearMessages,
        toggleDebug,
        openModelPicker: handleOpenModelPicker,
        openProviderPicker: handleOpenProviderPicker,
        addSystemMessage,
        showToast: toast.show,
        onExit,
      };
      const result = await executeCommand(`/${cmd.name}`, apiRef.current, ctx);
      if (result) {
        if (result.type === "message" && result.text) {
          addSystemMessage(result.text);
        } else if (result.type === "error" && result.text) {
          toast.show({ variant: "error", message: result.text });
        }
      }
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
      handleOpenModelPicker,
      handleOpenProviderPicker,
      addSystemMessage,
      toast,
    ],
  );

  // Register the actions for Keyboard
  useKeyboardShortcuts({
    paletteVisible,
    modelPickerOpen,
    providerPickerOpen,
    sidebarVisible,
    setPaletteVisible,
    setModelPickerOpen,
    setProviderPickerOpen,
    toggleSidebar,
    clearMessages,
    toggleDebug,
    onExit,
    bumpFocus,
  });

  const modelDisplay = model || undefined;
  const mainContentWidth =
    width - (sidebarVisible ? layout.sidebar.width : 0) - 4;

  return (
    <box
      flexDirection="row"
      width={width}
      height={height}
      backgroundColor={theme.background.surface}
    >
      <SessionSidebar />
      <MainContent
        hasConversation={hasConversation}
        messages={messages}
        streaming={streaming}
        handleSubmit={handleSubmit}
        composerLines={composerLines}
        modelDisplay={modelDisplay}
        serverUrl={serverUrl}
        height={height}
        focusTrigger={focusTrigger}
        paletteVisible={paletteVisible}
        setPaletteVisible={setPaletteVisible}
        bumpFocus={bumpFocus}
        handlePaletteSelect={handlePaletteSelect}
        modelPickerOpen={modelPickerOpen}
        setModelPickerOpen={setModelPickerOpen}
        providerPickerOpen={providerPickerOpen}
        setProviderPickerOpen={setProviderPickerOpen}
        sessionName={sessionName}
        mainContentWidth={mainContentWidth}
      />
    </box>
  );
}
