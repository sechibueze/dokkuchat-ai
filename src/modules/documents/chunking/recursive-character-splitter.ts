export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
  minChunkTokens?: number;
}

export interface Chunk {
  text: string;
  index: number;
  tokenEstimate: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

const SEPARATORS = ['\n\n', '\n', '. ', '? ', '! ', ' '];

export function estimateTokens(text: string): number {
  // Conservative engineering estimate only; not model-tokenizer accurate.
  return Math.ceil(text.length / 4);
}

function splitWithOffsets(
  text: string,
  separator: string,
  baseOffset: number,
): Array<{ text: string; startChar: number; endChar: number }> {
  const result: Array<{ text: string; startChar: number; endChar: number }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    const separatorIndex = text.indexOf(separator, cursor);
    const end = separatorIndex === -1 ? text.length : separatorIndex + separator.length;

    const part = text.slice(cursor, end);

    if (part.trim()) {
      result.push({
        text: part,
        startChar: baseOffset + cursor,
        endChar: baseOffset + end,
      });
    }

    cursor = end;
  }

  return result;
}

function recursiveSplit(
  text: string,
  separators: string[],
  maxTokens: number,
  baseOffset = 0,
): Array<{ text: string; startChar: number; endChar: number }> {
  if (!text.trim()) return [];

  if (estimateTokens(text) <= maxTokens) {
    return [
      {
        text,
        startChar: baseOffset,
        endChar: baseOffset + text.length,
      },
    ];
  }

  if (separators.length === 0) {
    // Hard split is the final fallback for long unbroken strings.
    const maxChars = maxTokens * 4;
    const chunks = [];

    for (let i = 0; i < text.length; i += maxChars) {
      const part = text.slice(i, i + maxChars);

      chunks.push({
        text: part,
        startChar: baseOffset + i,
        endChar: baseOffset + i + part.length,
      });
    }

    return chunks;
  }

  const separator = separators[0];
  const parts = splitWithOffsets(text, separator, baseOffset);

  if (parts.length <= 1) {
    return recursiveSplit(text, separators.slice(1), maxTokens, baseOffset);
  }

  const output: Array<{
    text: string;
    startChar: number;
    endChar: number;
  }> = [];

  let current: typeof parts = [];
  let currentText = '';

  const flush = () => {
    if (!current.length) return;

    const merged = {
      text: currentText,
      startChar: current[0].startChar,
      endChar: current[current.length - 1].endChar,
    };

    if (estimateTokens(merged.text) <= maxTokens) {
      output.push(merged);
    } else {
      output.push(...recursiveSplit(merged.text, separators.slice(1), maxTokens, merged.startChar));
    }

    current = [];
    currentText = '';
  };

  for (const part of parts) {
    const candidate = currentText + part.text;

    if (current.length && estimateTokens(candidate) > maxTokens) {
      flush();
    }

    current.push(part);
    currentText += part.text;
  }

  flush();
  return output;
}

function getOverlapStart(text: string, overlapTokens: number): number {
  if (overlapTokens <= 0) return text.length;

  const targetChars = overlapTokens * 4;
  const start = Math.max(0, text.length - targetChars);

  // Prefer starting at a word boundary.
  const boundary = text.indexOf(' ', start);

  return boundary === -1 ? start : boundary + 1;
}

export function chunkDocument(input: string, options: ChunkOptions = {}): Chunk[] {
  const maxTokens = options.maxTokens ?? 500;
  const overlapTokens = options.overlapTokens ?? 50;
  const minChunkTokens = options.minChunkTokens ?? 1;

  if (maxTokens < 1 || overlapTokens < 0 || minChunkTokens < 0) {
    throw new Error('Invalid chunk options');
  }

  if (overlapTokens >= maxTokens) {
    throw new Error('overlapTokens must be smaller than maxTokens');
  }

  const text = input.replace(/\r\n/g, '\n');
  const raw = recursiveSplit(text, SEPARATORS, maxTokens);

  const withOverlap = raw.map((chunk, index) => {
    if (index === 0 || overlapTokens === 0) return chunk;

    const previous = raw[index - 1];
    const overlapStart = getOverlapStart(previous.text, overlapTokens);
    const overlapText = previous.text.slice(overlapStart);
    const combined = overlapText + chunk.text;

    // Bound overlap to the available budget.
    if (estimateTokens(combined) > maxTokens) {
      return chunk;
    }

    return {
      text: combined,
      startChar: Math.max(0, chunk.startChar - overlapText.length),
      endChar: chunk.endChar,
    };
  });

  return withOverlap
    .filter((chunk) => chunk.text.trim())
    .filter((chunk) => estimateTokens(chunk.text) >= minChunkTokens)
    .map((chunk, index) => ({
      text: chunk.text,
      index,
      tokenEstimate: estimateTokens(chunk.text),
      metadata: {
        startChar: chunk.startChar,
        endChar: chunk.endChar,
      },
    }));
}
