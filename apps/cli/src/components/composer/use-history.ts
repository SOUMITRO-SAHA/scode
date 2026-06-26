import { useCallback, useRef } from "react";

import type { TextareaRenderable } from "@opentui/core";

interface UseHistoryOptions {
  textareaRef: React.RefObject<TextareaRenderable | null>;
  setInitialVal: (val: string) => void;
  setComposerKey: (fn: (prev: number) => number) => void;
}

interface UseHistoryResult {
  goHistory: (dir: -1 | 1) => void;
  pushToHistory: (value: string) => void;
}

export function useHistory({
  textareaRef,
  setInitialVal,
  setComposerKey,
}: UseHistoryOptions): UseHistoryResult {
  const historyRef = useRef<string[]>([]);
  const draftRef = useRef("");
  const histIdxRef = useRef(-1);

  const goHistory = useCallback(
    (dir: -1 | 1) => {
      const ta = textareaRef.current;
      const hist = historyRef.current;
      if (hist.length === 0) return;

      if (dir === -1) {
        if (histIdxRef.current === -1) {
          draftRef.current = ta?.plainText ?? "";
        }
        if (histIdxRef.current < hist.length - 1) {
          histIdxRef.current++;
          setInitialVal(hist[hist.length - 1 - histIdxRef.current]);
          setComposerKey((c) => c + 1);
        }
      } else {
        if (histIdxRef.current === -1) return;
        if (histIdxRef.current === 0) {
          histIdxRef.current = -1;
          setInitialVal(draftRef.current);
        } else {
          histIdxRef.current--;
          setInitialVal(hist[hist.length - 1 - histIdxRef.current]);
        }
        setComposerKey((c) => c + 1);
      }
    },
    [textareaRef, setInitialVal, setComposerKey],
  );

  const pushToHistory = useCallback((value: string) => {
    historyRef.current.push(value);
    histIdxRef.current = -1;
    draftRef.current = "";
  }, []);

  return { goHistory, pushToHistory };
}
