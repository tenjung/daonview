export interface SrtBlock {
  index: number;
  timeRange: string;
  text: string;
}

function parseSrtTimestampToSeconds(raw: string) {
  const match = raw.trim().match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return null;

  const [, hours, minutes, seconds, millis] = match;
  return (
    Number(hours) * 3600
    + Number(minutes) * 60
    + Number(seconds)
    + Number(millis) / 1000
  );
}

function formatSeconds(value: number) {
  return `${value.toFixed(1)}초`;
}

export function parseSrtToBlocks(srtText: string): SrtBlock[] {
  const normalized = srtText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  return normalized
    .split(/\n{2,}/)
    .map((chunk, chunkIndex) => {
      const lines = chunk.split('\n').map((line) => line.trimEnd()).filter(Boolean);
      if (lines.length < 2) return null;

      const hasNumericIndex = /^\d+$/.test(lines[0].trim());
      const index = hasNumericIndex ? Number(lines[0]) : chunkIndex + 1;
      const timeRange = hasNumericIndex ? lines[1] || '' : lines[0] || '';
      const textLines = hasNumericIndex ? lines.slice(2) : lines.slice(1);

      return {
        index,
        timeRange,
        text: textLines.join('\n'),
      };
    })
    .filter((block): block is SrtBlock => Boolean(block && block.timeRange));
}

export function serializeBlocksToSrt(blocks: SrtBlock[]) {
  return blocks
    .map((block, index) => {
      const safeText = block.text.trim();
      return `${index + 1}\n${block.timeRange}\n${safeText}`;
    })
    .join('\n\n')
    .trim();
}

export function formatTimeRangeToSeconds(timeRange: string) {
  const [startRaw, endRaw] = timeRange.split('-->').map((part) => part.trim());
  if (!startRaw || !endRaw) return timeRange;

  const start = parseSrtTimestampToSeconds(startRaw);
  const end = parseSrtTimestampToSeconds(endRaw);
  if (start === null || end === null) return timeRange;

  return `${formatSeconds(start)} ~ ${formatSeconds(end)}`;
}
