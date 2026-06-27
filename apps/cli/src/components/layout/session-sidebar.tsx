import { useCallback, useEffect, useRef, useState } from "react";

import fuzzysort from "fuzzysort";

import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  useCreateSession,
  useDeleteSession,
  useSessions,
} from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { type InputRenderable, RGBA, TextAttributes } from "@opentui/core";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import { DebugLogger } from "@scode/shared/logger";
import type { UnifiedMessage } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";
import { theme } from "@scode/theme";

const dbg = new DebugLogger("client:sidebar");

export function SessionSidebar() {
  const toast = useToast();
  const { width: termWidth, height: termHeight } = useTerminalDimensions();
  const serverUrl = useAppStore((s) => s.serverUrl);
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const streamingSessionId = useAppStore((s) => s.streamingSessionId);
  const model = useAppStore((s) => s.model);
  const setCurrentSessionId = useAppStore((s) => s.setCurrentSessionId);
  const setModel = useAppStore((s) => s.setModel);
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarSelectedIndex = useAppStore((s) => s.sidebarSelectedIndex);
  const setSidebarSelectedIndex = useAppStore((s) => s.setSidebarSelectedIndex);
  const { data, isLoading, isError } = useSessions(serverUrl);
  const createSession = useCreateSession(serverUrl);
  const deleteSession = useDeleteSession(serverUrl);
  const setMessages = useAppStore((s) => s.setMessages);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<InputRenderable>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  dbg.log("SessionSidebar rendered", {
    sidebarVisible,
    currentSessionId,
    streamingSessionId,
    sessionsCount: data?.sessions?.length ?? 0,
    searchQuery,
  });

  const handleCreate = useCallback(async () => {
    dbg.log("handleCreate called", { model });
    try {
      const res = await createSession.mutateAsync({
        name: "New Session",
        model: model ?? "",
        provider: "",
      });
      dbg.log("Session created", { id: res.id, name: res.name });
      setCurrentSessionId(res.id);
      toast.show({
        variant: "success",
        message: `Session created: ${res.id.slice(0, 8)}...`,
      });
    } catch (err) {
      dbg.error("Failed to create session", {
        error: (err as Error).message,
      });
      toast.show({
        variant: "error",
        message: `Failed to create session: ${(err as Error).message}`,
      });
    }
  }, [createSession, setCurrentSessionId, model, toast]);

  const executeDelete = useCallback(
    async (id: string) => {
      const wasActive = currentSessionId === id;
      dbg.log("Deleting session", { id, wasActive });
      await deleteSession.mutateAsync(id);
      dbg.log("Session deleted successfully", { id });
      if (wasActive) {
        setCurrentSessionId(undefined);
        clearMessages();
        dbg.log("Active session deleted, creating new session");
        try {
          const res = await createSession.mutateAsync({
            name: "New Session",
            model: model ?? "",
            provider: "",
          });
          dbg.log("New session created after delete", { id: res.id });
          setCurrentSessionId(res.id);
          toast.show({
            variant: "success",
            message: "Session deleted. New session created.",
          });
        } catch (err) {
          dbg.error("Failed to create new session after delete", {
            error: (err as Error).message,
          });
          toast.show({ variant: "success", message: "Session deleted" });
        }
      } else {
        toast.show({ variant: "success", message: "Session deleted" });
      }
    },
    [
      deleteSession,
      currentSessionId,
      setCurrentSessionId,
      clearMessages,
      createSession,
      model,
      toast,
    ],
  );

  const handleDeleteRequest = useCallback(
    (id: string, name: string) => {
      dbg.log("Delete button clicked", { sessionId: id, sessionName: name });
      if (id === streamingSessionId) {
        dbg.warn("Cannot delete running session", { id });
        toast.show({
          variant: "error",
          message: "Cannot delete a running session",
        });
        return;
      }
      setDeleteConfirm({ id, name });
    },
    [streamingSessionId, toast],
  );

  const handleSwitch = useCallback(
    async (id: string) => {
      dbg.log("handleSwitch called", { id });
      setCurrentSessionId(id);
      if (id) {
        try {
          dbg.log("Loading session data", { id });
          const [messagesResponse, sessionResponse] = await Promise.all([
            apiFetch<{ messages: UnifiedMessage[] }>(
              `/sessions/${encodeURIComponent(id)}/messages`,
              {},
              serverUrl,
            ),
            apiFetch<{ model: string; provider: string }>(
              `/sessions/${encodeURIComponent(id)}`,
              {},
              serverUrl,
            ),
          ]);
          dbg.log("Session data loaded", {
            id,
            messagesCount: messagesResponse.messages?.length ?? 0,
            model: sessionResponse.model,
          });
          setMessages(messagesResponse.messages);
          if (sessionResponse.model) {
            setModel(sessionResponse.model);
          }
        } catch (error) {
          dbg.error("Failed to load session", {
            id,
            error: (error as Error).message,
          });
          clearMessages();
        }
      } else {
        clearMessages();
      }
    },
    [setCurrentSessionId, setMessages, clearMessages, setModel, serverUrl],
  );

  const sessions = data?.sessions ?? [];
  const filteredSessions = searchQuery
    ? fuzzysort.go(searchQuery, sessions, { keys: ["name"] }).map((r) => r.obj)
    : sessions;

  dbg.log("Sessions computed", {
    totalSessions: sessions.length,
    filteredCount: filteredSessions.length,
    searchQuery,
  });

  useKeyboard((key) => {
    if (!sidebarVisible) return;

    if (key.name === "escape" && deleteConfirm) {
      setDeleteConfirm(null);
      return;
    }

    if (key.name === "up") {
      setSidebarSelectedIndex(Math.max(0, sidebarSelectedIndex - 1));
    } else if (key.name === "down") {
      setSidebarSelectedIndex(
        Math.min(filteredSessions.length - 1, sidebarSelectedIndex + 1),
      );
    } else if (key.name === "return") {
      if (deleteConfirm) {
        executeDelete(deleteConfirm.id);
        setDeleteConfirm(null);
      } else if (filteredSessions[sidebarSelectedIndex]) {
        handleSwitch(filteredSessions[sidebarSelectedIndex].id);
      }
    }
  });

  useEffect(() => {
    if (
      filteredSessions.length > 0 &&
      sidebarSelectedIndex >= filteredSessions.length
    ) {
      setSidebarSelectedIndex(filteredSessions.length - 1);
    }
  }, [filteredSessions.length, sidebarSelectedIndex, setSidebarSelectedIndex]);

  useEffect(() => {
    if (sidebarVisible && inputRef.current && !deleteConfirm) {
      inputRef.current.focus();
    }
  }, [sidebarVisible, deleteConfirm]);

  if (!sidebarVisible) return null;

  const confirmDialogWidth = Math.min(Math.floor(termWidth * 0.5), 40);

  return (
    <>
      <box
        width={30}
        height="100%"
        flexDirection="column"
        backgroundColor={theme.background.primary}
        paddingLeft={1}
        paddingRight={1}
      >
        <box
          flexDirection="row"
          alignItems="center"
          height={1}
          marginBottom={1}
          justifyContent="space-between"
        >
          <text fg={theme.brand.primary}>
            <strong>Sessions</strong>
          </text>
          <box onMouseDown={toggleSidebar}>
            <text fg={theme.text.muted}>✕</text>
          </box>
        </box>

        <box
          flexDirection="row"
          alignItems="center"
          height={1}
          gap={1}
          marginBottom={1}
        >
          <input
            onInput={(value: string) => {
              dbg.log("Search input changed", { value });
              setSearchQuery(value);
            }}
            focusedBackgroundColor={theme.background.surface}
            cursorColor={theme.brand.primary}
            focusedTextColor={theme.text.primary}
            ref={inputRef}
            placeholder="Search sessions..."
            placeholderColor={theme.text.muted}
            flexGrow={1}
            backgroundColor={theme.background.primary}
          />
          <box onMouseDown={handleCreate}>
            <text fg={theme.brand.primary}>+</text>
          </box>
        </box>

        <box flexDirection="column" flexGrow={1}>
          {isLoading && <text fg={theme.text.muted}>Loading...</text>}
          {isError && <text fg={theme.danger}>Failed to load</text>}
          {!isLoading && !isError && filteredSessions.length === 0 && (
            <text fg={theme.text.disabled}>
              {searchQuery ? "No matches" : "No sessions"}
            </text>
          )}
          {filteredSessions.map((sess, index) => {
            const active = sess.id === currentSessionId;
            const isStreaming = sess.id === streamingSessionId;
            const isSelected = index === sidebarSelectedIndex;
            return (
              <box
                key={sess.id}
                height={1}
                backgroundColor={
                  isSelected
                    ? theme.background.hover
                    : active
                      ? theme.background.active
                      : "transparent"
                }
              >
                <box flexDirection="row" width="100%">
                  <box
                    flexDirection="row"
                    flexGrow={1}
                    flexShrink={1}
                    onMouseDown={() => handleSwitch(sess.id)}
                  >
                    <text
                      fg={active ? theme.brand.primary : theme.text.primary}
                      width={2}
                    >
                      {active ? ">" : " "}
                    </text>
                    <text
                      fg={active ? theme.brand.primary : theme.text.primary}
                    >
                      {sess.name.slice(0, 12)}
                    </text>
                  </box>
                  <box
                    width={2}
                    flexShrink={0}
                    justifyContent="center"
                    alignItems="center"
                  >
                    {isStreaming ? (
                      <Spinner fg={RGBA.fromHex(theme.brand.primary)} />
                    ) : (
                      <text
                        fg={theme.text.muted}
                        onMouseDown={() =>
                          handleDeleteRequest(sess.id, sess.name)
                        }
                      >
                        ×
                      </text>
                    )}
                  </box>
                </box>
              </box>
            );
          })}
        </box>
      </box>

      {deleteConfirm && (
        <box
          position="absolute"
          left={0}
          top={0}
          width={termWidth}
          height={termHeight}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          zIndex={4000}
        >
          <box
            backgroundColor={theme.background.surface}
            width={confirmDialogWidth}
            borderStyle="rounded"
            borderColor={theme.border.focus}
            flexDirection="column"
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
          >
            <box flexDirection="row" justifyContent="space-between">
              <text fg={theme.text.primary} attributes={TextAttributes.BOLD}>
                Delete Session
              </text>
              <text
                fg={theme.text.muted}
                onMouseDown={() => setDeleteConfirm(null)}
              >
                esc
              </text>
            </box>
            <box paddingTop={1} paddingBottom={1}>
              <text fg={theme.text.muted}>
                Delete &quot;
                {deleteConfirm.name.slice(0, 20)}
                {deleteConfirm.name.length > 20 ? "..." : ""}&quot;?
              </text>
            </box>
            <box flexDirection="row" justifyContent="flex-end" gap={2}>
              <box
                paddingLeft={1}
                paddingRight={1}
                onMouseDown={() => setDeleteConfirm(null)}
              >
                <text fg={theme.text.muted}>Cancel</text>
              </box>
              <box
                paddingLeft={1}
                paddingRight={1}
                backgroundColor={theme.danger}
                onMouseDown={() => {
                  executeDelete(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
              >
                <text fg={theme.text.inverse}>Delete</text>
              </box>
            </box>
          </box>
        </box>
      )}
    </>
  );
}
