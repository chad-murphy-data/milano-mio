// Vocabulary state machine and spaced repetition logic.
// Pure functions — no React dependencies.

export const STATES = {
  NEW: 'NEW',
  LEARNING: 'LEARNING',
  FAMILIAR: 'FAMILIAR',
  STRONG: 'STRONG'
};

// Source of a vocabulary entry — informs Gabriella's queue priority.
//   'flagged'      — user tapped "I don't know this" mid-conversation
//   'tutorQuery'   — user asked Professoressa Elena (in-app chatbox) about it
//   'sessionLearn' — picked up via the auto-debrief (Claude/Gemini noticed
//                    the user used or struggled with it). Lowest priority.
export const SOURCES = {
  FLAGGED: 'flagged',
  TUTOR_QUERY: 'tutorQuery',
  SESSION_LEARN: 'sessionLearn'
};

// Days until a word should resurface after being marked correct.
const INTERVALS = {
  [STATES.LEARNING]: 1,
  [STATES.FAMILIAR]: 3,
  [STATES.STRONG]: 7
};

const STATE_ORDER = [STATES.NEW, STATES.LEARNING, STATES.FAMILIAR, STATES.STRONG];

// Threshold of greenTapCount at which a word "graduates" out of the active
// Gabriella queue and into the maintenance "we know these" pool. Spec:
// 0–1 active, 2–3 warming, 4 almost there, 5+ graduated.
export const GRADUATION_THRESHOLD = 5;

// Active-queue size at which Gabriella has enough material for a real
// lesson. Below this, visiting her triggers a casual chat instead.
// Drives both her system prompt branching and the map badge indicator.
export const LESSON_THRESHOLD = 10;

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
 *
 * @param {object|null} entry — existing vocab entry or null (new word)
 * @param {boolean} correct — true if word was in learned[], false if in retry[]
 * @param {string} location — scenario id
 * @param {object} [context] — optional flag-time context. Keys:
 *   sourceSentence, speaker, source (one of SOURCES). Only filled in for
 *   NEW entries — re-flagging an existing word doesn't overwrite the
 *   first-sighting context, since "where you first met this word" is the
 *   richer signal for Gabriella's review prompts.
 * @param {boolean} [isGreenTap] — true if this update came from an explicit
 *   user green-tap (not auto-debrief inference). Drives greenTapCount,
 *   which is the graduation signal for Gabriella's queue.
 * @returns {object} updated entry (new object, immutable)
 */
export function updateWordState(entry, correct, location, context = null, isGreenTap = false) {
  const now = new Date().toISOString();
  const isNew = !entry;
  const base = entry || {
    state: STATES.NEW,
    seenCount: 0,
    correctCount: 0,
    greenTapCount: 0,
    lastSeen: null,
    nextReview: now,
    location,
    sourceSentence: null,
    speaker: null,
    source: SOURCES.SESSION_LEARN,
    firstFlaggedAt: null
  };

  const seenCount = base.seenCount + 1;
  const correctCount = base.correctCount + (correct ? 1 : 0);
  const greenTapCount = base.greenTapCount + (isGreenTap ? 1 : 0);

  let state;
  if (correct) {
    state = nextState(base.state);
  } else {
    state = STATES.LEARNING;
  }

  const interval = INTERVALS[state] || 1;
  const nextReview = addDays(now, interval);

  // First-sighting context: only fill in when the entry didn't exist OR
  // when the existing entry has no context yet (back-compat for words
  // saved before the schema-v3 migration).
  const shouldFillContext =
    context && (isNew || !base.sourceSentence);

  return {
    state,
    seenCount,
    correctCount,
    greenTapCount,
    lastSeen: now,
    nextReview,
    location: location || base.location,
    sourceSentence: shouldFillContext ? context.sourceSentence : base.sourceSentence,
    speaker: shouldFillContext ? context.speaker : base.speaker,
    source: shouldFillContext ? (context.source || SOURCES.SESSION_LEARN) : base.source,
    firstFlaggedAt: shouldFillContext ? (context.firstFlaggedAt || now) : base.firstFlaggedAt
  };
}

/**
 * Reset a previously-graduated word back into the active queue. Triggered
 * when the user re-flags a word they'd previously been getting right —
 * green count drops to 0, state knocks back to LEARNING, source flips to
 * 'flagged' so Gabriella prioritizes it appropriately. The original
 * sourceSentence/speaker stay intact.
 */
export function reflagGraduatedWord(entry, sourceSentence, speaker, location) {
  const now = new Date().toISOString();
  return {
    ...entry,
    state: STATES.LEARNING,
    greenTapCount: 0,
    lastSeen: now,
    nextReview: now,
    source: SOURCES.FLAGGED,
    // Update the sentence/speaker if this re-flag is from a different
    // location — gives Gabriella fresher context to review against.
    sourceSentence: sourceSentence || entry.sourceSentence,
    speaker: speaker || entry.speaker,
    location: location || entry.location,
    firstFlaggedAt: entry.firstFlaggedAt || now
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
 *
 * @param {object} vocabulary
 * @param {string[]} learned — words/phrases the user got right
 * @param {string[]} retry — words to revisit
 * @param {string} location — scenario id
 * @param {object} [opts]
 *   @param {Array<{word, sourceSentence, speaker}>} [opts.flaggedContext]
 *     — rich context for words the user explicitly tapped "I don't know"
 *     during the session. Used to fill sourceSentence/speaker on first
 *     sighting + re-flag any graduated words back into the active queue.
 *   @param {Array<{word, sourceSentence, speaker}>} [opts.greenTapContext]
 *     — context for explicit user green-taps. Bumps greenTapCount toward
 *     graduation.
 * @returns {object} new vocabulary object
 */
export function processSessionResults(vocabulary, learned, retry, location, opts = {}) {
  const next = { ...vocabulary };
  const flagged = opts.flaggedContext || [];
  const green = opts.greenTapContext || [];

  // Build lookup maps of explicit user actions so we can pass context to
  // updateWordState and tag green-taps for graduation tracking.
  const flaggedByWord = new Map();
  for (const f of flagged) flaggedByWord.set(f.word.toLowerCase(), f);
  const greenByWord = new Map();
  for (const g of green) greenByWord.set(g.word.toLowerCase(), g);

  for (const entry of learned || []) {
    const word = extractWord(entry);
    if (!word) continue;
    const greenCtx = greenByWord.get(word);
    const isGreenTap = Boolean(greenCtx);
    const context = greenCtx
      ? {
          sourceSentence: greenCtx.sourceSentence,
          speaker: greenCtx.speaker,
          source: SOURCES.FLAGGED  // green-taps imply the user is engaging with the word, treat as same priority as flagged
        }
      : null;
    next[word] = updateWordState(next[word] || null, true, location, context, isGreenTap);
  }

  for (const entry of retry || []) {
    const word = extractWord(entry);
    if (!word) continue;
    const flaggedCtx = flaggedByWord.get(word);
    // If the existing entry has graduated and the user re-flagged it,
    // knock it back into the active queue with reflagGraduatedWord.
    const existing = next[word];
    if (existing && existing.greenTapCount >= GRADUATION_THRESHOLD && flaggedCtx) {
      next[word] = reflagGraduatedWord(
        existing,
        flaggedCtx.sourceSentence,
        flaggedCtx.speaker,
        location
      );
      continue;
    }
    const context = flaggedCtx
      ? {
          sourceSentence: flaggedCtx.sourceSentence,
          speaker: flaggedCtx.speaker,
          source: SOURCES.FLAGGED
        }
      : null;
    next[word] = updateWordState(next[word] || null, false, location, context, false);
  }
  return next;
}

/**
 * Add a word from a tutor (Elena chatbox) query into the vocab store.
 * Lower priority than a flagged word, but still surfaces to Gabriella.
 */
export function addTutorQueryWord(vocabulary, word, query) {
  if (!word) return vocabulary;
  const key = word.toLowerCase();
  const next = { ...vocabulary };
  const existing = next[key];
  // If the word already exists from a stronger source, don't downgrade it.
  if (existing && existing.source === SOURCES.FLAGGED) return next;
  if (existing) return next;
  const now = new Date().toISOString();
  next[key] = {
    state: STATES.LEARNING,
    seenCount: 0,
    correctCount: 0,
    greenTapCount: 0,
    lastSeen: null,
    nextReview: now,
    location: 'tutor',
    sourceSentence: query || null,
    speaker: 'Professoressa Elena',
    source: SOURCES.TUTOR_QUERY,
    firstFlaggedAt: now
  };
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
    if (entry.greenTapCount >= GRADUATION_THRESHOLD) continue;
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
    if (entry.greenTapCount >= GRADUATION_THRESHOLD) continue;
    if (entry.nextReview && entry.nextReview <= now) {
      due.push({ word, ...entry });
    }
  }
  due.sort((a, b) => (a.nextReview < b.nextReview ? -1 : 1));
  return due;
}

/**
 * Words eligible to surface in a Gabriella tutoring session — the "active
 * queue". Excludes graduated words (greenTapCount >= 5). Sorted by review
 * priority: greener words appear less often, recently-flagged words first.
 *
 * Priority bands (per spec):
 *   greenTapCount 0–1 → priority 1 (every session)
 *   greenTapCount 2–3 → priority 2 (every other session)
 *   greenTapCount 4   → priority 3 (occasional)
 */
export function getActiveQueue(vocabulary) {
  const all = [];
  for (const [word, entry] of Object.entries(vocabulary || {})) {
    if (entry.greenTapCount >= GRADUATION_THRESHOLD) continue;
    // 'flagged' source is the strongest signal; tutorQuery is mid;
    // sessionLearn (auto-detected) is weakest. Surface flagged first.
    const sourceWeight =
      entry.source === SOURCES.FLAGGED ? 0 :
      entry.source === SOURCES.TUTOR_QUERY ? 1 :
      2;
    all.push({ word, sourceWeight, ...entry });
  }
  // Sort: lowest greenTapCount first (more attention), then strongest
  // source first, then most-recently-flagged first.
  all.sort((a, b) => {
    if (a.greenTapCount !== b.greenTapCount) return a.greenTapCount - b.greenTapCount;
    if (a.sourceWeight !== b.sourceWeight) return a.sourceWeight - b.sourceWeight;
    const at = a.firstFlaggedAt || a.lastSeen || '';
    const bt = b.firstFlaggedAt || b.lastSeen || '';
    return at < bt ? 1 : -1;
  });
  return all;
}

/**
 * Pick the words Gabriella will work through in a single session, weighted
 * by recency and failure rate. Caps at 4-6 per the spec.
 */
export function pickGabriellaSessionWords(vocabulary, count = 5) {
  return getActiveQueue(vocabulary).slice(0, count);
}

/**
 * Aggregate stats for the vocabulary dashboard.
 */
export function getVocabStats(vocabulary) {
  const entries = Object.entries(vocabulary || {});
  const now = new Date().toISOString();
  const byState = { NEW: 0, LEARNING: 0, FAMILIAR: 0, STRONG: 0 };
  let dueForReview = 0;
  let graduated = 0;
  const fumbleScores = [];

  for (const [word, entry] of entries) {
    byState[entry.state] = (byState[entry.state] || 0) + 1;
    if ((entry.greenTapCount || 0) >= GRADUATION_THRESHOLD) graduated++;
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
    graduated,
    activeQueueSize: entries.length - graduated,
    mostFumbled: fumbleScores.slice(0, 5)
  };
}
