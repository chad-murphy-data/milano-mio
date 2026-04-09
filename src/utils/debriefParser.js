// Extracts structured blocks from Claude responses:
// [DEBRIEF]...[/DEBRIEF]  — session results (learned, retry, character assessment)
// [CHARACTER_MEMORY]...[/CHARACTER_MEMORY] — facts for persistent character memory (CL mode)

function tryParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(raw.replace(/,(\s*[}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

/**
 * Extract [DEBRIEF] block. Returns { spoken, debrief }.
 * Backward-compatible — unchanged from Sprint 1.
 */
export function parseDebrief(text) {
  const match = text.match(/\[DEBRIEF\]([\s\S]*?)\[\/DEBRIEF\]/);
  if (!match) {
    return { spoken: text.trim(), debrief: null };
  }
  const debrief = tryParseJSON(match[1].trim());
  const spoken = text.replace(/\[DEBRIEF\][\s\S]*?\[\/DEBRIEF\]/, '').trim();
  return { spoken, debrief };
}

/**
 * Extract [CHARACTER_MEMORY] block. Returns { text, characterMemory }.
 */
export function parseCharacterMemory(text) {
  const match = text.match(/\[CHARACTER_MEMORY\]([\s\S]*?)\[\/CHARACTER_MEMORY\]/);
  if (!match) {
    return { text: text.trim(), characterMemory: null };
  }
  const characterMemory = tryParseJSON(match[1].trim());
  const cleaned = text.replace(/\[CHARACTER_MEMORY\][\s\S]*?\[\/CHARACTER_MEMORY\]/, '').trim();
  return { text: cleaned, characterMemory };
}

/**
 * Extract [HINT: ...] tag. Returns { text, hint }.
 */
export function parseHint(text) {
  const match = text.match(/\[HINT:\s*(.+?)\]/);
  if (!match) {
    return { text: text.trim(), hint: null };
  }
  const hint = match[1].trim();
  const cleaned = text.replace(/\[HINT:\s*.+?\]/, '').trim();
  return { text: cleaned, hint };
}

/**
 * Extract [ENGLISH: ...] tag. Returns { text, english }.
 */
export function parseEnglish(text) {
  const match = text.match(/\[ENGLISH:\s*([\s\S]*?)\]/);
  if (!match) {
    return { text: text.trim(), english: null };
  }
  const english = match[1].trim();
  const cleaned = text.replace(/\[ENGLISH:\s*[\s\S]*?\]/, '').trim();
  return { text: cleaned, english };
}

/**
 * Extract all structured blocks in one pass.
 * Returns { spoken, debrief, characterMemory, hint, english }.
 */
export function parseResponse(text) {
  const { text: withoutMemory, characterMemory } = parseCharacterMemory(text);
  const { text: withoutHint, hint } = parseHint(withoutMemory);
  const { text: withoutEnglish, english } = parseEnglish(withoutHint);
  const { spoken, debrief } = parseDebrief(withoutEnglish);
  return { spoken, debrief, characterMemory, hint, english };
}
