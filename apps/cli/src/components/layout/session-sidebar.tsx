import { useCallback, useEffect, useRef, useState } from "react";

import { Effect } from "effect";
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
import type { SessionInfo, UnifiedMessage } from "@scode/shared/types";
import { apiFetch } from "@scode/shared/utils";
import { theme } from "@scode/theme";

const dbg = new DebugLogger("client:sidebar");

type SidebarItem =
  | { type: "header"; label: string; key: string }
  | { type: "session"; session: SessionInfo; flatIndex: number };

function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sessionDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (sessionDay.getTime() === today.getTime()) return "Today";
  if (sessionDay.getTime() === yesterday.getTime()) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function groupSessionsByDate(sessions: SessionInfo[]): SidebarItem[] {
  const groups = new Map<string, SessionInfo[]>();

  for (const session of sessions) {
    const label = getDateGroupLabel(session.updatedAt);
    const existing = groups.get(label);
    if (existing) {
      existing.push(session);
    } else {
      groups.set(label, [session]);
    }
  }

  const items: SidebarItem[] = [];
  let flatIndex = 0;

  for (const [label, groupSessions] of groups) {
    items.push({ type: "header", label, key: `header-${label}` });
    for (const session of groupSessions) {
      items.push({ type: "session", session, flatIndex });
      flatIndex++;
    }
  }

  return items;
}

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
            Effect.runPromise(
              apiFetch<{ messages: UnifiedMessage[] }>(
                `/sessions/${encodeURIComponent(id)}/messages`,
                {},
                serverUrl,
              ),
            ),
            Effect.runPromise(
              apiFetch<{ model: string; provider: string }>(
                `/sessions/${encodeURIComponent(id)}`,
                {},
                serverUrl,
              ),
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
  const sortedSessions = searchQuery
    ? fuzzysort.go(searchQuery, sessions, { keys: ["name"] }).map((r) => r.obj)
    : sessions;
  const sidebarItems = groupSessionsByDate(sortedSessions);
  const sessionCount = sortedSessions.length;

  dbg.log("Sessions computed", {
    totalSessions: sessions.length,
    filteredCount: sortedSessions.length,
    searchQuery,
  });

  const getNextSelectableIndex = useCallback(
    (current: number, direction: 1 | -1): number => {
      let next = current + direction;
      while (next >= 0 && next < sidebarItems.length) {
        if (sidebarItems[next].type === "session") return next;
        next += direction;
      }
      if (direction === 1) {
        for (let i = sidebarItems.length - 1; i >= 0; i--) {
          if (sidebarItems[i].type === "session") return i;
        }
      }
      return current;
    },
    [sidebarItems],
  );

  useKeyboard((key) => {
    if (!sidebarVisible) return;

    if (key.name === "escape" && deleteConfirm) {
      setDeleteConfirm(null);
      return;
    }

    if (key.name === "up") {
      setSidebarSelectedIndex(getNextSelectableIndex(sidebarSelectedIndex, -1));
    } else if (key.name === "down") {
      setSidebarSelectedIndex(getNextSelectableIndex(sidebarSelectedIndex, 1));
    } else if (key.name === "return") {
      if (deleteConfirm) {
        executeDelete(deleteConfirm.id);
        setDeleteConfirm(null);
      } else {
        const item = sidebarItems[sidebarSelectedIndex];
        if (item?.type === "session") {
          handleSwitch(item.session.id);
        }
      }
    }
  });

  useEffect(() => {
    if (sessionCount > 0 && sidebarSelectedIndex >= sidebarItems.length) {
      const lastSession = getNextSelectableIndex(sidebarItems.length, -1);
      setSidebarSelectedIndex(lastSession);
    }
  }, [
    sessionCount,
    sidebarSelectedIndex,
    sidebarItems.length,
    getNextSelectableIndex,
    setSidebarSelectedIndex,
  ]);

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

        <scrollbox flexGrow={1}>
          {isLoading && <text fg={theme.text.muted}>Loading...</text>}
          {isError && <text fg={theme.danger}>Failed to load</text>}
          {!isLoading && !isError && sessionCount === 0 && (
            <text fg={theme.text.disabled}>
              {searchQuery ? "No matches" : "No sessions"}
            </text>
          )}
          {sidebarItems.map((item, index) => {
            if (item.type === "header") {
              return (
                <box key={item.key} height={2} flexDirection="column">
                  <box flexDirection="row" width="100%">
                    <box flexGrow={1} flexShrink={1}>
                      <text
                        fg={theme.brand.primary}
                        attributes={TextAttributes.BOLD}
                      >
                        {item.label}
                      </text>
                    </box>
                    <box width={2} flexShrink={0} />
                  </box>
                </box>
              );
            }

            const { session } = item;
            const active = session.id === currentSessionId;
            const isStreaming = session.id === streamingSessionId;
            const isSelected = index === sidebarSelectedIndex;
            return (
              <box
                key={session.id}
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
                    overflow="hidden"
                    onMouseDown={() => handleSwitch(session.id)}
                  >
                    <text
                      fg={active ? theme.brand.primary : theme.text.primary}
                      width={2}
                    >
                      {active ? ">" : " "}
                    </text>

                    <text
                      fg={active ? theme.brand.primary : theme.text.primary}
                      wrapMode="word"
                      truncate={true}
                    >
                      {session.name}
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
                          handleDeleteRequest(session.id, session.name)
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
        </scrollbox>
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
