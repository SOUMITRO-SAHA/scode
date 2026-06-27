import { Header } from "./header.js";
import { Landing } from "./landing.js";

import { ChatArea } from "@/components/chat/index.js";
import type { Command } from "@/components/commands/commands.js";
import { CommandPalette } from "@/components/commands/index.js";
import { ConnectProvider } from "@/components/commands/index.js";
import { ModelSwitcher } from "@/components/commands/index.js";
import { Composer } from "@/components/composer/index.js";
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
  paletteVisible: boolean;
  setPaletteVisible: (visible: boolean) => void;
  bumpFocus: () => void;
  handlePaletteSelect: (cmd: Command) => void;
  modelPickerOpen: boolean;
  setModelPickerOpen: (open: boolean) => void;
  providerPickerOpen: boolean;
  setProviderPickerOpen: (open: boolean) => void;
  sessionName?: string;
  mainContentWidth: number;
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
  paletteVisible,
  setPaletteVisible,
  bumpFocus,
  handlePaletteSelect,
  modelPickerOpen,
  setModelPickerOpen,
  providerPickerOpen,
  setProviderPickerOpen,
  sessionName,
  mainContentWidth,
}: MainContentProps) {
  return (
    <box flexDirection="column" flexGrow={1}>
      {hasConversation && (
        <Header modelDisplay={modelDisplay} sessionName={sessionName} />
      )}

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
            containerWidth={mainContentWidth}
          />
        )}
        <CommandPalette
          visible={paletteVisible}
          onClose={() => {
            setPaletteVisible(false);
            bumpFocus();
          }}
          onSelect={handlePaletteSelect}
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
      </box>
    </box>
  );
}
