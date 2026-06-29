import React, { useState } from "react";

import * as Effect from "effect/Effect";

import { Header } from "./header";
import { Landing } from "./landing";

import { ChatArea } from "@/components/chat/index";
import type { Command } from "@/components/commands/commands";
import { CommandPalette } from "@/components/commands/index";
import { ConnectProvider } from "@/components/commands/index";
import { ModelSwitcher } from "@/components/commands/index";
import { SessionDeleteConfirm } from "@/components/commands/index";
import { SessionRename } from "@/components/commands/index";
import { SkillBrowser } from "@/components/commands/index";
import { Composer } from "@/components/composer/index";
import { useToast } from "@/components/ui/toast";
import type { ApiClient } from "@/services/api";
import type { TextareaRenderable } from "@opentui/core";
import type { Message } from "@scode/shared/types";

interface MainContentProps {
  hasConversation: boolean;
  messages: Message[];
  streaming: boolean;
  handleSubmit: (value: string) => void;
  composerLines: number;
  modelDisplay?: string;
  serverUrl: string;
  height: number;
  focusTrigger: number;
  prefill?: string;
  paletteVisible: boolean;
  setPaletteVisible: (visible: boolean) => void;
  bumpFocus: () => void;
  handlePaletteSelect: (cmd: Command) => void;
  modelPickerOpen: boolean;
  setModelPickerOpen: (open: boolean) => void;
  providerPickerOpen: boolean;
  setProviderPickerOpen: (open: boolean) => void;
  skillsBrowserOpen: boolean;
  setSkillsBrowserOpen: (open: boolean) => void;
  onSkillSelect: (skillName: string) => void;
  sessionName?: string;
  mainContentWidth: number;
  textareaRef?: React.RefObject<TextareaRenderable | null>;
  renameDialogOpen: boolean;
  setRenameDialogOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  api: ApiClient;
  currentSessionId?: string;
  clearMessages: () => void;
  setCurrentSessionId: (id: string | undefined) => void;
  onRefreshSessions: () => void;
}

export function MainContent({
  hasConversation,
  messages,
  streaming,
  handleSubmit,
  composerLines,
  modelDisplay,
  serverUrl,
  height,
  focusTrigger,
  prefill,
  paletteVisible,
  setPaletteVisible,
  bumpFocus,
  handlePaletteSelect,
  modelPickerOpen,
  setModelPickerOpen,
  providerPickerOpen,
  setProviderPickerOpen,
  skillsBrowserOpen,
  setSkillsBrowserOpen,
  onSkillSelect,
  sessionName,
  mainContentWidth,
  textareaRef,
  renameDialogOpen,
  setRenameDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  api,
  currentSessionId,
  clearMessages,
  setCurrentSessionId,
  onRefreshSessions,
}: MainContentProps) {
  const toast = useToast();
  const [composerClearTrigger, setComposerClearTrigger] = useState(0);

  const handlePaletteSelectWrap = (cmd: Command) => {
    setComposerClearTrigger((c) => c + 1);
    handlePaletteSelect(cmd);
  };

  return (
    <box flexDirection="column" flexGrow={1}>
      {hasConversation && <Header sessionName={sessionName} />}

      <box
        flexDirection="column"
        paddingLeft={1.5}
        paddingRight={1.5}
        flexGrow={1}
      >
        {hasConversation ? (
          <ChatArea messages={messages} streaming={streaming} />
        ) : (
          <Landing
            onSubmit={handleSubmit}
            streaming={streaming}
            height={height}
            modelDisplay={modelDisplay}
            mainContentWidth={mainContentWidth}
            clearTrigger={composerClearTrigger}
            focusTrigger={focusTrigger}
            textareaRef={textareaRef}
          />
        )}
        {hasConversation && (
          <Composer
            onSubmit={handleSubmit}
            streaming={streaming}
            lines={composerLines}
            placeholder={streaming ? "Waiting..." : "Ask anything..."}
            modelDisplay={modelDisplay}
            serverUrl={serverUrl}
            focusTrigger={focusTrigger}
            clearTrigger={composerClearTrigger}
            prefill={prefill}
            containerWidth={mainContentWidth}
            textareaRef={textareaRef}
          />
        )}
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
            onSelect={onSkillSelect}
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
            api={api}
            onClose={() => {
              setRenameDialogOpen(false);
              bumpFocus();
            }}
            onRefresh={onRefreshSessions}
          />
        )}
        {deleteDialogOpen && currentSessionId && (
          <SessionDeleteConfirm
            name={sessionName ?? currentSessionId}
            onConfirm={() => {
              Effect.runPromise(api.deleteSession(currentSessionId)).then(
                () => {
                  setCurrentSessionId(undefined);
                  clearMessages();
                  onRefreshSessions();
                  toast.show({
                    variant: "success",
                    message: "Session deleted",
                  });
                  setDeleteDialogOpen(false);
                  bumpFocus();
                },
              );
            }}
            onCancel={() => {
              setDeleteDialogOpen(false);
              bumpFocus();
            }}
          />
        )}
      </box>
    </box>
  );
}
