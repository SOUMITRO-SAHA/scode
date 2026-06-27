import { useCallback, useEffect, useRef, useState } from "react";

import fuzzysort from "fuzzysort";

import { useDialog } from "@/components/ui/dialog";
import { DialogConfirm } from "@/components/ui/dialog-confirm";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  useCreateSession,
  useDeleteSession,
  useSessions,
} from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { type InputRenderable, RGBA } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import type { UnifiedMessage } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";
import { theme } from "@scode/theme";

export function SessionSidebar() {
  const dialog = useDialog();
  const toast = useToast();
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

  const handleCreate = useCallback(async () => {
    try {
      const res = await createSession.mutateAsync({
        name: "New Session",
        model: model ?? "",
        provider: "",
      });
      setCurrentSessionId(res.id);
      toast.show({
        variant: "success",
        message: `Session created: ${res.id.slice(0, 8)}...`,
      });
    } catch (err) {
      toast.show({
        variant: "error",
        message: `Failed to create session: ${(err as Error).message}`,
      });
    }
  }, [createSession, setCurrentSessionId, model, toast]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (id === streamingSessionId) {
        toast.show({
          variant: "error",
          message: "Cannot delete a running session",
        });
        return;
      }
      const confirmed = await DialogConfirm.show(
        dialog,
        "Delete Session",
        `Delete "${name.slice(0, 20)}${name.length > 20 ? "..." : ""}"?`,
        "delete",
      );
      if (confirmed) {
        const wasActive = currentSessionId === id;
        await deleteSession.mutateAsync(id);
        if (wasActive) {
          setCurrentSessionId(undefined);
          clearMessages();
          // Create a new session automatically
          try {
            const res = await createSession.mutateAsync({
              name: "New Session",
              model: model ?? "",
              provider: "",
            });
            setCurrentSessionId(res.id);
            toast.show({
              variant: "success",
              message: "Session deleted. New session created.",
            });
          } catch {
            toast.show({
              variant: "success",
              message: "Session deleted",
            });
          }
        } else {
          toast.show({ variant: "success", message: "Session deleted" });
        }
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
      dialog,
      streamingSessionId,
    ],
  );

  const handleSwitch = useCallback(
    async (id: string) => {
      setCurrentSessionId(id);
      // Load session messages and model
      if (id) {
        try {
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
          setMessages(messagesResponse.messages);
          if (sessionResponse.model) {
            setModel(sessionResponse.model);
          }
        } catch (error) {
          console.error("Failed to load session:", error);
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

  // Keyboard navigation for sidebar
  useKeyboard((key) => {
    if (!sidebarVisible) return;

    if (key.name === "up") {
      setSidebarSelectedIndex(Math.max(0, sidebarSelectedIndex - 1));
    } else if (key.name === "down") {
      setSidebarSelectedIndex(
        Math.min(filteredSessions.length - 1, sidebarSelectedIndex + 1),
      );
    } else if (key.name === "return") {
      // Enter key - switch to selected session
      if (filteredSessions[sidebarSelectedIndex]) {
        handleSwitch(filteredSessions[sidebarSelectedIndex].id);
      }
    }
  });

  // Reset selected index when sessions change
  useEffect(() => {
    if (
      filteredSessions.length > 0 &&
      sidebarSelectedIndex >= filteredSessions.length
    ) {
      setSidebarSelectedIndex(filteredSessions.length - 1);
    }
  }, [filteredSessions.length, sidebarSelectedIndex, setSidebarSelectedIndex]);

  // Focus search input when sidebar opens
  useEffect(() => {
    if (sidebarVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sidebarVisible]);

  if (!sidebarVisible) return null;

  return (
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
          onInput={(value: string) => setSearchQuery(value)}
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
                  <text fg={active ? theme.brand.primary : theme.text.primary}>
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
                    <box onMouseDown={() => handleDelete(sess.id, sess.name)}>
                      <text fg={theme.text.muted}>×</text>
                    </box>
                  )}
                </box>
              </box>
            </box>
          );
        })}
      </box>
    </box>
  );
}
