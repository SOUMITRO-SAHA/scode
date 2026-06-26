export function parseModelString(
  input: string,
): { providerId: string; model: string } | null {
  const idx = input.indexOf("/");
  if (idx === -1) return null;
  const providerId = input.slice(0, idx);
  const model = input.slice(idx + 1);
  if (!providerId || !model) return null;
  return { providerId, model };
}

export function formatModelName(modelId: string): string {
  return modelId
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
