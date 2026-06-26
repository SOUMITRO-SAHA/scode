export function dateFromFilename(name: string): Date | null {
  const match = name.match(/scode(?:\.(\d{4}-\d{2}-\d{2}))?/);
  if (!match) return null;
  const dateStr = match[1];
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00Z");
  return isNaN(d.getTime()) ? null : d;
}

export function daysOld(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
