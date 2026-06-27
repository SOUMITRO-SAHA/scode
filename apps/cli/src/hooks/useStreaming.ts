import { useCallback, useState } from "react";

import * as Effect from "effect/Effect";

import { sendPrompt } from "../services/client";

import type { Message } from "@scode/shared/types";

export function useStreaming(serverUrl: string, model?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const addSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "system", content: text }]);
  }, []);

  const submit = useCallback(
    (userMsg: string) => {
      if (!userMsg.trim() || loading) return;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMsg },
        { role: "assistant", content: "" },
      ]);
      setLoading(true);
      (async () => {
        let full = "";
        try {
          await Effect.runPromise(
            sendPrompt(
              userMsg,
              serverUrl,
              (token: string) => {
                full += token;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", content: full };
                  return copy;
                });
              },
              model,
            ),
          );
        } catch (err) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: `Error: ${(err as Error).message}`,
            };
            return copy;
          });
        } finally {
          setLoading(false);
        }
      })();
    },
    [serverUrl, loading, model],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLoading(false);
  }, []);

  return { messages, loading, submit, clearMessages, addSystemMessage };
}
