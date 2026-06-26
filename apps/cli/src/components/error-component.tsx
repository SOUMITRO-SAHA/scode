import { useCallback, useState } from "react";

import { TextAttributes } from "@opentui/core";
import {
  useKeyboard,
  useRenderer,
  useTerminalDimensions,
} from "@opentui/react";
import { theme } from "@scode/theme";

export function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const renderer = useRenderer();
  const { width, height } = useTerminalDimensions();
  const [copied, setCopied] = useState(false);

  const exit = useCallback(() => {
    renderer.destroy();
    process.exit(1);
  }, [renderer]);

  useKeyboard((evt) => {
    if (evt.ctrl && evt.name === "c") {
      exit();
    } else if (evt.name === "return" || evt.name === "enter") {
      reset();
    } else if (evt.name === "escape") {
      exit();
    }
  });

  const issueURL = new URL(
    "https://github.com/aspect-build/scode/issues/new?template=bug-report.yml",
  );

  if (error.message) {
    issueURL.searchParams.set("title", `scode: fatal: ${error.message}`);
  }

  if (error.stack) {
    issueURL.searchParams.set(
      "description",
      "```\n" +
        error.stack.substring(0, 6000 - issueURL.toString().length) +
        "...\n```",
    );
  }

  const copyIssueURL = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyError = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <box
      flexDirection="column"
      width={width}
      height={height}
      backgroundColor={theme.background.primary}
      padding={2}
      gap={1}
    >
      <box flexDirection="row" gap={1} alignItems="center">
        <text attributes={TextAttributes.BOLD} fg={theme.text.primary}>
          Fatal Error
        </text>
        <box
          onMouseUp={copyIssueURL}
          backgroundColor={theme.brand.primary}
          paddingX={1}
          paddingY={0}
        >
          <text attributes={TextAttributes.BOLD} fg={theme.background.primary}>
            Copy Issue URL
          </text>
        </box>
        {copied && <text fg={theme.success}>Copied!</text>}
      </box>

      <text fg={theme.text.primary}>{error.message}</text>

      <box flexDirection="row" gap={2} alignItems="center">
        <box
          onMouseUp={reset}
          backgroundColor={theme.brand.primary}
          paddingX={1}
          paddingY={0}
        >
          <text attributes={TextAttributes.BOLD} fg={theme.background.primary}>
            Reset (Enter)
          </text>
        </box>
        <box
          onMouseUp={exit}
          backgroundColor={theme.danger}
          paddingX={1}
          paddingY={0}
        >
          <text attributes={TextAttributes.BOLD} fg={theme.background.primary}>
            Exit (Esc/Ctrl+C)
          </text>
        </box>
      </box>

      <box
        flexDirection="column"
        flexGrow={1}
        overflow="hidden"
        borderStyle="single"
        borderColor={theme.danger}
        marginTop={1}
      >
        <box
          flexDirection="row"
          justifyContent="flex-end"
          paddingX={1}
          paddingTop={1}
        >
          <box
            onMouseUp={copyError}
            backgroundColor={theme.brand.primary}
            paddingX={1}
            paddingY={0}
          >
            <text
              attributes={TextAttributes.BOLD}
              fg={theme.background.primary}
            >
              Copy
            </text>
          </box>
        </box>

        <scrollbox
          height={Math.max(1, height - 12)}
          stickyScroll
          stickyStart="bottom"
          paddingLeft={1}
          paddingRight={1}
        >
          <text fg={theme.text.muted}>{error.stack}</text>
        </scrollbox>
      </box>

      <box flexDirection="row" gap={1} marginTop={1}>
        <text fg={theme.text.muted}>
          Press Enter to reset, Esc or Ctrl+C to exit
        </text>
      </box>
    </box>
  );
}
