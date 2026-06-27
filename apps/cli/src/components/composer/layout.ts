import type { ComposerLayout, ModelInfo } from "./types";

import { formatModelName, parseModelString } from "@scode/shared/utils";

export function calculateLayout(
  terminalWidth: number,
  fullWidth = false,
): ComposerLayout {
  if (fullWidth) {
    const boxWidth = terminalWidth - 4;
    const inputWidth = boxWidth - 4;
    const borderPad = 2;
    const autoWidth = boxWidth;
    return { boxWidth, inputWidth, borderPad, autoWidth };
  }

  const maxWidth = 80;
  const boxWidth = Math.min(terminalWidth - 4, maxWidth);
  const inputWidth = boxWidth - 4;
  const borderPad = Math.max(2, Math.floor((terminalWidth - boxWidth) / 2));
  const autoWidth = boxWidth;
  return { boxWidth, inputWidth, borderPad, autoWidth };
}

export function parseModelDisplay(modelDisplay?: string): ModelInfo {
  if (!modelDisplay) {
    return { modelName: "", providerName: "", hasModel: false };
  }

  const parsed = parseModelString(modelDisplay);
  if (!parsed) {
    return { modelName: "", providerName: "", hasModel: false };
  }

  const modelName = formatModelName(parsed.model);
  const providerName = parsed.providerId ?? "";

  return {
    modelName,
    providerName,
    hasModel: !!modelName,
  };
}
