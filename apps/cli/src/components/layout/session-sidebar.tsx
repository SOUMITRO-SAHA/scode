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
import { theme } from "@scode/theme";

export function SessionSidebar() {
  const serverUrl = useAppStore((s) => s.serverUrl);
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const streamingSessionId = useAppStore((s) => s.streamingSessionId);
  const setCurrentSessionId = useAppStore((s) => s.setCurrentSessionId);
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarSelectedIndex = useAppStore((s) => s.sidebarSelectedIndex);
  const setSidebarSelectedIndex = useAppStore((s) => s.setSidebarSelectedIndex);
  const { data, isLoading, isError } = useSessions(serverUrl);
  const createSession = useCreateSession(serverUrl);
  const deleteSession = useDeleteSession(serverUrl);

  const handleCreate = useCallback(async () => {
    const res = await createSession.mutateAsync({ name: "New Session" });
    setCurrentSessionId(res.id);
  }, [createSession, setCurrentSessionId]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSession.mutateAsync(id);
      if (currentSessionId === id) setCurrentSessionId(undefined);
    },
    [deleteSession, currentSessionId, setCurrentSessionId],
  );

  const handleSwitch = useCallback(
    (id: string) => {
      setCurrentSessionId(id);
    },
    [setCurrentSessionId],
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
