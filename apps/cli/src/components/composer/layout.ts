import type { ComposerLayout, ModelInfo } from "./types";

import { formatModelName, parseModelString } from "@scode/shared/utils";

export function calculateLayout(availableWidth: number): ComposerLayout {
  const inputWidth = availableWidth - 8;
  const borderPad = 2;
  const autoWidth = availableWidth - 4;
  return {
    boxWidth: -1,
    inputWidth,
    borderPad,
    autoWidth,
  };
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
