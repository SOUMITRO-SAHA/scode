import { useCallback, useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import {
  useCreateSession,
  useDeleteSession,
  useSessions,
} from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { RGBA } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import type { UnifiedMessage } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";
import { theme } from "@scode/theme";

export function SessionSidebar() {
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

  const handleCreate = useCallback(async () => {
    const res = await createSession.mutateAsync({
      name: "New Session",
      model: model ?? "",
      provider: "",
    });
    setCurrentSessionId(res.id);
  }, [createSession, setCurrentSessionId, model]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSession.mutateAsync(id);
      if (currentSessionId === id) setCurrentSessionId(undefined);
    },
    [deleteSession, currentSessionId, setCurrentSessionId],
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

  // Keyboard navigation for sidebar
  useKeyboard((key) => {
    if (!sidebarVisible) return;

    if (key.name === "up") {
      setSidebarSelectedIndex(Math.max(0, sidebarSelectedIndex - 1));
    } else if (key.name === "down") {
      setSidebarSelectedIndex(
        Math.min(sessions.length - 1, sidebarSelectedIndex + 1),
      );
    } else if (key.name === "return") {
      // Enter key - switch to selected session
      if (sessions[sidebarSelectedIndex]) {
        handleSwitch(sessions[sidebarSelectedIndex].id);
      }
    }
  });

  // Reset selected index when sessions change
  useEffect(() => {
    if (sessions.length > 0 && sidebarSelectedIndex >= sessions.length) {
      setSidebarSelectedIndex(sessions.length - 1);
    }
  }, [sessions.length, sidebarSelectedIndex, setSidebarSelectedIndex]);

  if (!sidebarVisible) return null;

  return (
    <box
      width={30}
      height="100%"
      flexDirection="column"
      backgroundColor={theme.background.primary}
    >
      <box
        flexDirection="row"
        alignItems="center"
        paddingLeft={1}
        paddingRight={1}
        height={1}
        justifyContent="space-between"
      >
        <text fg={theme.brand.primary}>
          <strong>Sessions</strong>
        </text>

        <box onMouseDown={toggleSidebar}>
          <text fg={theme.text.muted}>✕</text>
        </box>
      </box>

      <box paddingLeft={1} paddingRight={1} height={1}>
        <box onMouseDown={handleCreate}>
          <text fg={theme.text.disabled}>+ New Session</text>
        </box>
      </box>

      <box flexDirection="column" flexGrow={1}>
        {isLoading && (
          <text fg={theme.text.muted} paddingLeft={1}>
            Loading...
          </text>
        )}
        {isError && (
          <text fg={theme.danger} paddingLeft={1}>
            Failed to load
          </text>
        )}
        {!isLoading && !isError && sessions.length === 0 && (
          <text fg={theme.text.disabled} paddingLeft={1}>
            No sessions
          </text>
        )}
        {sessions.map((sess, index) => {
          const active = sess.id === currentSessionId;
          const isStreaming = sess.id === streamingSessionId;
          const isSelected = index === sidebarSelectedIndex;
          return (
            <box
              key={sess.id}
              height={1}
              paddingLeft={1}
              backgroundColor={
                isSelected
                  ? theme.background.hover
                  : active
                    ? theme.background.active
                    : "transparent"
              }
            >
              <box
                flexDirection="row"
                width="100%"
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
                  flexGrow={1}
                >
                  {sess.name.slice(0, 16)}
                </text>
                {isStreaming && (
                  <box width={2} justifyContent="flex-end">
                    <Spinner fg={RGBA.fromHex(theme.brand.primary)} />
                  </box>
                )}
              </box>
            </box>
          );
        })}
      </box>
    </box>
  );
}
