import { useCallback } from "react"
import { theme } from "@scode/theme"
import { useSessions, useCreateSession, useDeleteSession } from "../hooks/useApi"
import { useAppStore } from "../store/index"

export function SessionSidebar() {
  const serverUrl = useAppStore((s) => s.serverUrl)
  const currentSessionId = useAppStore((s) => s.currentSessionId)
  const setCurrentSessionId = useAppStore((s) => s.setCurrentSessionId)
  const sidebarVisible = useAppStore((s) => s.sidebarVisible)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const { data, isLoading, isError } = useSessions(serverUrl)
  const createSession = useCreateSession(serverUrl)
  const deleteSession = useDeleteSession(serverUrl)

  const handleCreate = useCallback(async () => {
    const res = await createSession.mutateAsync({ name: "New Session" })
    setCurrentSessionId(res.id)
  }, [createSession, setCurrentSessionId])

  const handleDelete = useCallback(async (id: string) => {
    await deleteSession.mutateAsync(id)
    if (currentSessionId === id) setCurrentSessionId(undefined)
  }, [deleteSession, currentSessionId, setCurrentSessionId])

  const handleSwitch = useCallback((id: string) => {
    setCurrentSessionId(id)
  }, [setCurrentSessionId])

  if (!sidebarVisible) return null

  const s = data?.sessions ?? []

  return (
    <box
      width={30}
      height="100%"
      flexDirection="column"
      borderStyle="rounded"
      borderColor={theme.border.secondary}
      backgroundColor={theme.background.secondary}
    >
      <box paddingLeft={1} paddingRight={1} height={1} justifyContent="space-between">
        <text fg={theme.brand.primary}><strong>Sessions</strong></text>
        <box onMouseDown={toggleSidebar}><text fg={theme.text.muted}>✕</text></box>
      </box>
      <box paddingLeft={1} paddingRight={1} height={1}>
        <box onMouseDown={handleCreate}><text fg={theme.text.disabled}>+ New Session</text></box>
      </box>
      <box flexDirection="column" flexGrow={1}>
        {isLoading && <text fg={theme.text.muted} paddingLeft={1}>Loading...</text>}
        {isError && <text fg={theme.danger} paddingLeft={1}>Failed to load</text>}
        {!isLoading && !isError && s.length === 0 && (
          <text fg={theme.text.disabled} paddingLeft={1}>No sessions</text>
        )}
        {s.map((sess) => {
          const active = sess.id === currentSessionId
          return (
            <box
              key={sess.id}
              height={1}
              paddingLeft={1}
              backgroundColor={active ? theme.background.hover : "transparent"}
            >
              <box onMouseDown={() => handleSwitch(sess.id)}>
                <text fg={active ? theme.brand.primary : theme.text.primary}>
                  {active ? ">" : " "} {sess.name.slice(0, 18)}
                </text>
              </box>
            </box>
          )
        })}
      </box>
    </box>
  )
}
