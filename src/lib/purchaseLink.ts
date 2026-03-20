export interface ParsedOptionCandidate {
  label: string;
  key: string;
}

export function normalizeOptionLabel(label: string): string {
  return String(label || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeOptionKey(label: string): string {
  return normalizeOptionLabel(label).toUpperCase();
}

function stripRankPrefix(value: string): string {
  return value.replace(/^\s*\d+\s*지망:\s*/i, '').trim();
}

export function extractOptionCandidates(selectedOption?: string | null): ParsedOptionCandidate[] {
  if (!selectedOption) return [];

  const rawParts = String(selectedOption)
    .split('|')
    .map((part) => stripRankPrefix(part))
    .filter(Boolean);

  const unique = new Map<string, ParsedOptionCandidate>();
  rawParts.forEach((label) => {
    const normalizedLabel = normalizeOptionLabel(label);
    const key = normalizeOptionKey(normalizedLabel);
    if (!key || unique.has(key)) return;
    unique.set(key, { label: normalizedLabel, key });
  });

  return Array.from(unique.values());
}

export function parseLinkInput(value: string): string[] {
  const rows = String(value || '')
    .split(/\r?\n|,/)
    .map((row) => row.trim())
    .filter(Boolean);

  return Array.from(new Set(rows));
}

