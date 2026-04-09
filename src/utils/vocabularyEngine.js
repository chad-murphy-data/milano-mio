// Vocabulary state machine and spaced repetition logic.
// Pure functions — no React dependencies.

export const STATES = {
  NEW: 'NEW',
  LEARNING: 'LEARNING',
  FAMILIAR: 'FAMILIAR',
  STRONG: 'STRONG'
};

// Days until a word should resurface after being marked correct.
const INTERVALS = {
  [STATES.LEARNING]: 1,
  [STATES.FAMILIAR]: 3,
  [STATES.STRONG]: 7
};

const STATE_ORDER = [STATES.NEW, STATES.LEARNING, STATES.FAMILIAR, STATES.STRONG];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function nextState(current) {
  const idx = STATE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STATE_ORDER.length - 1) return STATES.STRONG;
  return STATE_ORDER[idx + 1];
}

/**
 * Update a single word entry after a session.
 * @param {object|null} entry — existing vocab entry or null (new word)
 * @param {boolean} correct — true if word was in learned[], false if in retry[]
 * @param {string} location — scenario id
 * @returns {object} updated entry (new object, immutable)
 */
export function updateWordState(entry, correct, location) {
  const now = new Date().toISOString();
  const base = entry || {
    state: STATES.NEW,
    seenCount: 0,
    correctCount: 0,
    lastSeen: null,
    nextReview: now,
    location
  };

  const seenCount = base.seenCount + 1;
  const correctCount = base.correctCount + (correct ? 1 : 0);

  let state;
  if (correct) {
    state = nextState(base.state);
  } else {
    state = STATES.LEARNING;
  }

  const interval = INTERVALS[state] || 1;
  const nextReview = addDays(now, interval);

  return {
    state,
    seenCount,
    correctCount,
    lastSeen: now,
    nextReview,
    location: location || base.location
  };
}

/**
 * Extract the Italian phrase from a "italian — english" string.
 */
export function extractWord(entry) {
  if (!entry) return '';
  const dash = entry.indexOf('—');
  if (dash < 0) return entry.trim().toLowerCase();
  return entry.slice(0, dash).trim().toLowerCase();
}

/**
 * Process an entire session's learned + retry arrays into the vocabulary store.
 * @returns {object} new vocabulary object
 */
export function processSessionResults(vocabulary, learned, retry, location) {
  const next = { ...vocabulary };
  for (const entry of learned || []) {
    const word = extractWord(entry);
    if (!word) continue;
    next[word] = updateWordState(next[word] || null, true, location);
  }
  for (const entry of retry || []) {
    const word = extractWord(entry);
    if (!word) continue;
    next[word] = updateWordState(next[word] || null, false, location);
  }
  return next;
}

/**
 * Get words due for review at a specific location, capped.
 * Returns array of word keys (Italian phrases).
 */
export function getRetryWordsForLocation(vocabulary, location, cap = 5) {
  const now = new Date().toISOString();
  const due = [];
  for (const [word, entry] of Object.entries(vocabulary || {})) {
    if (entry.location !== location) continue;
    if (entry.state === STATES.NEW) continue;
    if (entry.nextReview && entry.nextReview <= now) {
      due.push({ word, nextReview: entry.nextReview, state: entry.state });
    }
  }
  due.sort((a, b) => (a.nextReview < b.nextReview ? -1 : 1));
  return due.slice(0, cap).map((d) => d.word);
}

/**
 * Get ALL words due for review across all locations.
 */
export function getDueWords(vocabulary) {
  const now = new Date().toISOString();
  const due = [];
  for (const [word, entry] of Object.entries(vocabulary || {})) {
    if (entry.state === STATES.NEW) continue;
    if (entry.nextReview && entry.nextReview <= now) {
      due.push({ word, ...entry });
    }
  }
  due.sort((a, b) => (a.nextReview < b.nextReview ? -1 : 1));
  return due;
}

/**
 * Aggregate stats for the vocabulary dashboard.
 */
export function getVocabStats(vocabulary) {
  const entries = Object.entries(vocabulary || {});
  const now = new Date().toISOString();
  const byState = { NEW: 0, LEARNING: 0, FAMILIAR: 0, STRONG: 0 };
  let dueForReview = 0;
  const fumbleScores = [];

  for (const [word, entry] of entries) {
    byState[entry.state] = (byState[entry.state] || 0) + 1;
    if (entry.state !== STATES.NEW && entry.nextReview && entry.nextReview <= now) {
      dueForReview++;
    }
    const fumble = entry.seenCount - entry.correctCount;
    if (fumble > 0) {
      fumbleScores.push({ word, fumble, ...entry });
    }
  }

  fumbleScores.sort((a, b) => b.fumble - a.fumble);

  return {
    total: entries.length,
    byState,
    dueForReview,
    mostFumbled: fumbleScores.slice(0, 5)
  };
}
