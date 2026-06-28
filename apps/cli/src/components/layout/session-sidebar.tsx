import { useCallback, useEffect, useRef, useState } from "react";

import { Effect } from "effect";
import fuzzysort from "fuzzysort";

import { SessionDeleteConfirm } from "@/components/commands/index";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  useCreateSession,
  useDeleteSession,
  useSessions,
} from "@/hooks/useApi";
import { useAppStore } from "@/store/index";
import { type InputRenderable, RGBA, TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
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
  const pendingSelectIdRef = useRef<string | null>(null);

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

  const executeDelete = useCallback(
    async (id: string) => {
      const wasActive = currentSessionId === id;
      dbg.log("Deleting session", { id, wasActive });

      // Choose the session to focus next: the one just below in the current
      // list, otherwise the one just above. Computed before deletion.
      const deleteIdx = sortedSessions.findIndex((s) => s.id === id);
      const nextSession =
        deleteIdx >= 0
          ? (sortedSessions[deleteIdx + 1] ?? sortedSessions[deleteIdx - 1])
          : undefined;
      const nextSessionId = nextSession?.id;

      await deleteSession.mutateAsync(id);
      dbg.log("Session deleted successfully", { id, nextSessionId });

      // After the sessions list refetches, move the sidebar highlight to the
      // next session instead of leaving the selection stale.
      if (nextSessionId) {
        pendingSelectIdRef.current = nextSessionId;
      }

      if (wasActive) {
        if (nextSessionId) {
          dbg.log("Switching active session to next after delete", {
            nextSessionId,
          });
          await handleSwitch(nextSessionId);
        } else {
          dbg.log("No remaining sessions; clearing active session");
          setCurrentSessionId(undefined);
          clearMessages();
        }
      }

      toast.show({ variant: "success", message: "Session deleted" });
    },
    [
      currentSessionId,
      sortedSessions,
      deleteSession,
      handleSwitch,
      setCurrentSessionId,
      clearMessages,
      toast,
    ],
  );

  useKeyboard((key) => {
    if (!sidebarVisible) return;
    // When the delete-confirm overlay is open, let it own the keyboard.
    if (deleteConfirm) return;

    if (key.name === "up") {
      setSidebarSelectedIndex(getNextSelectableIndex(sidebarSelectedIndex, -1));
    } else if (key.name === "down") {
      setSidebarSelectedIndex(getNextSelectableIndex(sidebarSelectedIndex, 1));
    } else if (key.name === "return") {
      const item = sidebarItems[sidebarSelectedIndex];
      if (item?.type === "session") {
        handleSwitch(item.session.id);
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

  // After a deletion, move the highlight to the next session once the
  // refetched list is available.
  useEffect(() => {
    const targetId = pendingSelectIdRef.current;
    if (targetId == null) return;
    pendingSelectIdRef.current = null;
    const idx = sidebarItems.findIndex(
      (it) => it.type === "session" && it.session.id === targetId,
    );
    if (idx >= 0) {
      setSidebarSelectedIndex(idx);
    }
  }, [sidebarItems, setSidebarSelectedIndex]);

  useEffect(() => {
    if (sidebarVisible && inputRef.current && !deleteConfirm) {
      inputRef.current.focus();
    }
  }, [sidebarVisible, deleteConfirm]);

  if (!sidebarVisible) return null;

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
              const hasPrevious = index > 0;
              return (
                <box
                  key={item.key}
                  height={1}
                  marginTop={hasPrevious ? 1 : 0}
                  flexDirection="row"
                  width="100%"
                >
                  <text width={2}> </text>
                  <text
                    fg={theme.brand.active}
                    attributes={TextAttributes.BOLD}
                  >
                    {item.label.toUpperCase()}
                  </text>
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
                flexDirection="row"
                width="100%"
                backgroundColor={
                  isSelected
                    ? theme.background.hover
                    : active
                      ? theme.background.active
                      : "transparent"
                }
              >
                <text
                  fg={active ? theme.brand.primary : theme.text.primary}
                  width={2}
                  onMouseDown={() => handleSwitch(session.id)}
                >
                  {active ? ">" : " "}
                </text>

                <text
                  fg={active ? theme.brand.primary : theme.text.primary}
                  flexGrow={1}
                  flexShrink={1}
                  overflow="hidden"
                  truncate={true}
                  onMouseDown={() => handleSwitch(session.id)}
                >
                  {session.name}
                </text>

                <box width={2} flexShrink={0} justifyContent="center">
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
            );
          })}
        </scrollbox>
      </box>

      {deleteConfirm && (
        <SessionDeleteConfirm
          name={deleteConfirm.name}
          onConfirm={() => {
            executeDelete(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
