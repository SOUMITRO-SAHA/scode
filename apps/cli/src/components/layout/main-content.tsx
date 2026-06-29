import React from "react";

import { Header } from "./header";
import { Landing } from "./landing";

import { ChatArea } from "@/components/chat/index";
import { Composer } from "@/components/composer/index";
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
  sessionName?: string;
  mainContentWidth: number;
  textareaRef?: React.RefObject<TextareaRenderable | null>;
  composerClearTrigger: number;
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
  sessionName,
  mainContentWidth,
  textareaRef,
  composerClearTrigger,
}: MainContentProps) {
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
      </box>
    </box>
  );
}
