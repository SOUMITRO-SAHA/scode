import {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Effect } from "effect";

import {
  type Command,
  type CommandContext,
  executeCommand,
  parseCommand,
} from "@/components/commands/commands";
import {
  AgentSwitcher,
  CommandPalette,
  ConnectProvider,
  HealthDialog,
  HelpDialog,
  LogsDialog,
  ModelSwitcher,
  SessionDeleteConfirm,
  SessionHistory,
  SessionRename,
  SkillBrowser,
} from "@/components/commands/index";
import { ErrorBoundary } from "@/components/error/index";
import { MainContent, SessionSidebar } from "@/components/layout/index";
import { DialogProvider } from "@/components/ui/dialog";
import { Toast, ToastProvider, useToast } from "@/components/ui/toast";
import { useHealth, useSessions } from "@/hooks/useApi";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useStreamChat } from "@/hooks/useStreamChat";
import { ApiClient } from "@/services/api";
import { gracefulShutdown, setRendererCleanup } from "@/services/shutdown";
import { useAppStore } from "@/store/index";
import { copy as copySelection } from "@/utils/selection";
import { type TextareaRenderable, createCliRenderer } from "@opentui/core";
import { createRoot, useRenderer } from "@opentui/react";
import { useTerminalDimensions } from "@opentui/react";
import {
  QUERY_RETRY,
  QUERY_STALE_TIME,
  sessionPath,
} from "@scode/shared/constants";
import { Logger, initDebugLog } from "@scode/shared/logger";
import { apiFetch, errorMessage } from "@scode/shared/utils";
import { layout, theme } from "@scode/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

initDebugLog();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY,
      staleTime: QUERY_STALE_TIME,
      refetchOnWindowFocus: false,
    },
  },
});

const logger = new Logger({ stderr: true });

export async function startTui(
  serverUrl: string,
  model?: string,
): Promise<boolean> {
  try {
    const renderer = await createCliRenderer({
      exitOnCtrlC: false,
      targetFps: 30,
    });

    setRendererCleanup(() => renderer.destroy());

    process.on("SIGINT", () => {
      void Effect.runPromise(gracefulShutdown(0, serverUrl));
    });

    process.on("uncaughtException", (err) => {
      logger.error(`Uncaught exception: ${err.message}`);
      void Effect.runPromise(gracefulShutdown(1, serverUrl));
    });

    process.on("unhandledRejection", (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      logger.error(`Unhandled rejection: ${message}`);
      void Effect.runPromise(gracefulShutdown(1, serverUrl));
    });

    const handleExit = () => {
      void Effect.runPromise(gracefulShutdown(0, serverUrl));
    };

    const root = createRoot(renderer);
    root.render(
      <QueryClientProvider client={queryClient}>
        <StrictMode>
          <ErrorBoundary>
            <App serverUrl={serverUrl} model={model} onExit={handleExit} />
          </ErrorBoundary>
        </StrictMode>
      </QueryClientProvider>,
    );

    return true;
  } catch (err) {
    logger.debug(`TUI init failed: ${Effect.runSync(errorMessage(err))}`);
    return false;
  }
}

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
  const { messages, streaming, submit: chatSubmit } = useStreamChat(serverUrl);
  const { width, height } = useTerminalDimensions();
  const renderer = useRenderer();

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
      Effect.runPromise(
        apiFetch(
          sessionPath(currentSessionId),
          {
            method: "PATCH",
            body: JSON.stringify({ model }),
          },
          serverUrl,
        ),
      ).catch(() => {});
    }
  }, [model, currentSessionId, serverUrl]);

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [providerPickerOpen, setProviderPickerOpen] = useState(false);
  const [skillsBrowserOpen, setSkillsBrowserOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const bumpFocus = useCallback(() => setFocusTrigger((n) => n + 1), []);
  const [composerClearTrigger, setComposerClearTrigger] = useState(0);
  const handleOpenModelPicker = useCallback(() => setModelPickerOpen(true), []);
  const handleOpenProviderPicker = useCallback(
    () => setProviderPickerOpen(true),
    [],
  );
  const handleOpenSkillsBrowser = useCallback(
    () => setSkillsBrowserOpen(true),
    [],
  );
  const handleOpenAgentDialog = useCallback(() => setAgentDialogOpen(true), []);
  const handleOpenHealthDialog = useCallback(
    () => setHealthDialogOpen(true),
    [],
  );
  const handleSkillSelect = useCallback((skillName: string) => {
    useAppStore.getState().addSelectedSkill(skillName);
  }, []);
  const apiRef = useRef(new ApiClient(serverUrl));
  const textareaRef = useRef<TextareaRenderable | null>(null);

  // Initialize model from props on first render if not set
  if (!model && initialModel) useAppStore.getState().setModel(initialModel);

  const handleSetSessionId = useCallback(
    (id: string | undefined) => {
      setCurrentSessionId(id);
    },
    [setCurrentSessionId],
  );

  const handleSetModel = useCallback(
    (m: string | undefined) => {
      setModel(m);
    },
    [setModel],
  );

  const handleRefreshSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sessions", serverUrl] });
  }, [serverUrl]);

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
          messages,
          setModel: handleSetModel,
          setCurrentSessionId: handleSetSessionId,
          clearMessages,
          toggleDebug,
          openModelPicker: handleOpenModelPicker,
          openProviderPicker: handleOpenProviderPicker,
          openSkillsBrowser: handleOpenSkillsBrowser,
          toggleSidebar,
          addSystemMessage,
          showToast: toast.show,
          onExit,
          refreshSessions: handleRefreshSessions,
          openRenameDialog: () => setRenameDialogOpen(true),
          openDeleteDialog: () => setDeleteDialogOpen(true),
          openHistoryDialog: () => setHistoryDialogOpen(true),
          openHelpDialog: () => setHelpDialogOpen(true),
          openLogsDialog: () => setLogsDialogOpen(true),
          openAgentDialog: handleOpenAgentDialog,
          openHealthDialog: handleOpenHealthDialog,
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
      messages,
      handleSetModel,
      handleSetSessionId,
      clearMessages,
      toggleDebug,
      handleOpenModelPicker,
      handleOpenProviderPicker,
      addSystemMessage,
      toast,
      chatSubmit,
      handleRefreshSessions,
    ],
  );

  const handlePaletteSelect = useCallback(
    async (cmd: Command) => {
      const ctx: CommandContext = {
        model,
        serverUrl,
        currentSessionId,
        debugEnabled: debug,
        messages,
        setModel: handleSetModel,
        setCurrentSessionId: handleSetSessionId,
        clearMessages,
        toggleDebug,
        openModelPicker: handleOpenModelPicker,
        openProviderPicker: handleOpenProviderPicker,
        openSkillsBrowser: handleOpenSkillsBrowser,
        toggleSidebar,
        addSystemMessage,
        showToast: toast.show,
        onExit,
        refreshSessions: handleRefreshSessions,
        openRenameDialog: () => setRenameDialogOpen(true),
        openDeleteDialog: () => setDeleteDialogOpen(true),
        openHistoryDialog: () => setHistoryDialogOpen(true),
        openHelpDialog: () => setHelpDialogOpen(true),
        openLogsDialog: () => setLogsDialogOpen(true),
        openAgentDialog: handleOpenAgentDialog,
        openHealthDialog: handleOpenHealthDialog,
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
      messages,
      handleSetModel,
      handleSetSessionId,
      clearMessages,
      toggleDebug,
      handleOpenModelPicker,
      handleOpenProviderPicker,
      toggleSidebar,
      addSystemMessage,
      toast,
      handleRefreshSessions,
    ],
  );

  const handlePaletteSelectWrap = useCallback(
    (cmd: Command) => {
      setComposerClearTrigger((c) => c + 1);
      handlePaletteSelect(cmd);
    },
    [handlePaletteSelect],
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
    width - (sidebarVisible ? layout.sidebar.width : 0) - 3;

  const handleMouseUp = useCallback(() => {
    copySelection(renderer, toast);
  }, [renderer, toast]);

  return (
    <box
      flexDirection="row"
      width={width}
      height={height}
      backgroundColor={theme.background.surface}
      onMouseUp={handleMouseUp}
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
        prefill={prefill}
        sessionName={sessionName}
        mainContentWidth={mainContentWidth}
        textareaRef={textareaRef}
        composerClearTrigger={composerClearTrigger}
      />

      {/* Dialogs rendered at root level so position="absolute" left={0} is relative to terminal, not MainContent */}
      <CommandPalette
        visible={paletteVisible}
        onClose={() => {
          setPaletteVisible(false);
          bumpFocus();
        }}
        onSelect={handlePaletteSelectWrap}
      />
      {modelPickerOpen && (
        <ModelSwitcher
          onClose={() => {
            setModelPickerOpen(false);
            bumpFocus();
          }}
        />
      )}
      {providerPickerOpen && (
        <ConnectProvider
          onClose={() => {
            setProviderPickerOpen(false);
            bumpFocus();
          }}
        />
      )}
      {skillsBrowserOpen && (
        <SkillBrowser
          onSelect={handleSkillSelect}
          onClose={() => {
            setSkillsBrowserOpen(false);
            bumpFocus();
          }}
        />
      )}
      {renameDialogOpen && currentSessionId && (
        <SessionRename
          name={sessionName}
          sessionId={currentSessionId}
          api={apiRef.current}
          onClose={() => {
            setRenameDialogOpen(false);
            bumpFocus();
          }}
          onRefresh={handleRefreshSessions}
        />
      )}
      {historyDialogOpen && (
        <SessionHistory
          messages={messages}
          onClose={() => {
            setHistoryDialogOpen(false);
            bumpFocus();
          }}
        />
      )}
      {deleteDialogOpen && currentSessionId && (
        <SessionDeleteConfirm
          name={sessionName ?? currentSessionId}
          onConfirm={() => {
            Effect.runPromise(
              apiRef.current.deleteSession(currentSessionId),
            ).then(() => {
              setCurrentSessionId(undefined);
              clearMessages();
              handleRefreshSessions();
              toast.show({
                variant: "success",
                message: "Session deleted",
              });
              setDeleteDialogOpen(false);
              bumpFocus();
            });
          }}
          onCancel={() => {
            setDeleteDialogOpen(false);
            bumpFocus();
          }}
        />
      )}
      {helpDialogOpen && (
        <HelpDialog
          onClose={() => {
            setHelpDialogOpen(false);
            bumpFocus();
          }}
        />
      )}
      {logsDialogOpen && (
        <LogsDialog
          api={apiRef.current}
          onClose={() => {
            setLogsDialogOpen(false);
            bumpFocus();
          }}
        />
      )}
      {agentDialogOpen && (
        <AgentSwitcher
          onClose={() => {
            setAgentDialogOpen(false);
            bumpFocus();
          }}
        />
      )}
      {healthDialogOpen && (
        <HealthDialog
          api={apiRef.current}
          onClose={() => {
            setHealthDialogOpen(false);
            bumpFocus();
          }}
        />
      )}
    </box>
  );
}
