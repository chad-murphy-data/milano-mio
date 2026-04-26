import { useCallback, useEffect, useState } from 'react';
import { processSessionResults, STATES } from '../utils/vocabularyEngine.js';

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  const update = useCallback((updater) => {
    setValue((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  return [value, update];
}

// ---------------------------------------------------------------------------
// User selection — Chad / Charlie / Guest
// Each named user gets their own scoped store (`milano-mio-store:<user>`) so
// their sessions, vocabulary, and companion don't bleed into each other.
// Guest uses an in-memory store that is never persisted — nothing survives a
// reload or a switch away from Guest.
// ---------------------------------------------------------------------------

const USER_KEY = 'milano-mio-current-user';
const LEGACY_STORE_KEY = 'milano-mio-store';

export const USERS = {
  CHAD: 'chad',
  CHARLIE: 'charlie',
  GUEST: 'guest',
};

function storeKeyFor(user) {
  return `milano-mio-store:${user}`;
}

// Ephemeral store for Guest mode. Reset every time Guest is (re)selected so
// switching to Guest always starts fresh, the way a private window would.
let guestStore = defaultStore();

export function loadCurrentUser() {
  try {
    return window.localStorage.getItem(USER_KEY) || null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user) {
  try {
    window.localStorage.setItem(USER_KEY, user);
  } catch {}
  if (user === USERS.GUEST) {
    guestStore = defaultStore();
  } else if (user) {
    ensureUserStore(user);
  }
}

export function isGuest() {
  return loadCurrentUser() === USERS.GUEST;
}

// First time Chad is picked we adopt the pre-multi-user `milano-mio-store`
// so his existing progress carries over. Charlie always starts fresh. The
// legacy key is left in place as a backup — never written to again.
function ensureUserStore(user) {
  try {
    const key = storeKeyFor(user);
    if (window.localStorage.getItem(key)) return;
    if (user === USERS.CHAD) {
      const legacy = window.localStorage.getItem(LEGACY_STORE_KEY);
      if (legacy) {
        window.localStorage.setItem(key, legacy);
        return;
      }
    }
    window.localStorage.setItem(key, JSON.stringify(defaultStore()));
  } catch {}
}

// ---------------------------------------------------------------------------
// App store — sessions, vocabulary, character memory (scoped to current user)
// ---------------------------------------------------------------------------

function defaultStore() {
  return {
    schemaVersion: 3,
    sessions: [],
    vocabulary: {},
    characters: {},
    tutorQueries: []
  };
}

function readUserStore() {
  const user = loadCurrentUser();
  if (user === USERS.GUEST) return guestStore;
  if (!user) return defaultStore();
  try {
    const raw = window.localStorage.getItem(storeKeyFor(user));
    if (!raw) return defaultStore();
    return JSON.parse(raw);
  } catch {
    return defaultStore();
  }
}

function writeUserStore(store) {
  const user = loadCurrentUser();
  if (user === USERS.GUEST) {
    guestStore = store;
    return;
  }
  if (!user) return;
  try {
    window.localStorage.setItem(storeKeyFor(user), JSON.stringify(store));
  } catch {}
}

/**
 * Schema migrations:
 *   v1 vocab entries: { seen, correct, nextReview }
 *   v2 vocab entries: { state, seenCount, correctCount, lastSeen, nextReview, location }
 *   v3 vocab entries: + greenTapCount, sourceSentence, speaker, source,
 *                       firstFlaggedAt   (for Gabriella's review queue)
 *   v3 store: + tutorQueries[]
 */
function migrateStore(store) {
  let mutated = false;

  // v1 → v2
  if (!store.schemaVersion || store.schemaVersion < 2) {
    const now = new Date().toISOString();
    const oldVocab = store.vocabulary || {};
    const newVocab = {};

    for (const [word, entry] of Object.entries(oldVocab)) {
      const seen = entry.seen || 0;
      const correct = entry.correct || 0;
      let state = STATES.NEW;
      if (seen > 0 && correct >= 3) state = STATES.STRONG;
      else if (seen > 0 && correct >= 1) state = STATES.FAMILIAR;
      else if (seen > 0) state = STATES.LEARNING;

      newVocab[word.toLowerCase()] = {
        state,
        seenCount: seen,
        correctCount: correct,
        lastSeen: null,
        nextReview: entry.nextReview || now,
        location: 'caffe' // all Sprint 1 words came from the caffè
      };
    }

    store.vocabulary = newVocab;
    store.characters = store.characters || {};
    store.schemaVersion = 2;
    mutated = true;
  }

  // v2 → v3 — add Gabriella-tracking fields with safe defaults. Existing
  // entries get greenTapCount: 0 (so they're all "active" until the user
  // green-taps them) and source: 'sessionLearn' since we can't recover
  // the original capture context.
  if (store.schemaVersion < 3) {
    const oldVocab = store.vocabulary || {};
    const newVocab = {};
    for (const [word, entry] of Object.entries(oldVocab)) {
      newVocab[word] = {
        ...entry,
        greenTapCount: entry.greenTapCount ?? 0,
        sourceSentence: entry.sourceSentence ?? null,
        speaker: entry.speaker ?? null,
        source: entry.source ?? 'sessionLearn',
        firstFlaggedAt: entry.firstFlaggedAt ?? null
      };
    }
    store.vocabulary = newVocab;
    store.tutorQueries = store.tutorQueries || [];
    store.schemaVersion = 3;
    mutated = true;
  }

  if (mutated) writeUserStore(store);
  return store;
}

export function loadStore() {
  return migrateStore(readUserStore());
}

export function saveSession(session) {
  const store = loadStore();
  store.sessions.push(session);
  // session.flaggedContext / session.greenTapContext carry the rich
  // sentence + speaker context for words the user explicitly marked
  // mid-conversation. processSessionResults uses them to fill in
  // sourceSentence/speaker on first sighting and bump greenTapCount
  // toward graduation.
  store.vocabulary = processSessionResults(
    store.vocabulary,
    session.learned || [],
    session.retry || [],
    session.location,
    {
      flaggedContext: session.flaggedContext || [],
      greenTapContext: session.greenTapContext || []
    }
  );
  writeUserStore(store);
  return store;
}

// ---------------------------------------------------------------------------
// Tutor (Professoressa Elena) query log
// Words/phrases the player asked the in-app chatbox about feed Gabriella's
// secondary "curious about" queue. We persist the raw query + a timestamp
// here, then a lightweight extractor pulls Italian phrases out and adds
// them to vocabulary via addTutorQueryWord on save.
// ---------------------------------------------------------------------------

export function saveTutorQuery(query, response = null) {
  if (!query || !query.trim()) return;
  const store = loadStore();
  store.tutorQueries = store.tutorQueries || [];
  store.tutorQueries.push({
    query: query.trim(),
    response: response || null,
    timestamp: new Date().toISOString()
  });
  writeUserStore(store);
}

export function loadTutorQueries() {
  const store = loadStore();
  return store.tutorQueries || [];
}

// ---------------------------------------------------------------------------
// Character memory persistence
// ---------------------------------------------------------------------------

export function loadCharacter(name) {
  const store = loadStore();
  return store.characters?.[name] || {
    sessionCount: 0,
    facts: [],
    lastTopic: null,
    coveredTopics: []
  };
}

export function saveCharacter(name, data) {
  const store = loadStore();
  store.characters = store.characters || {};
  store.characters[name] = data;
  writeUserStore(store);
}

// ---------------------------------------------------------------------------
// Companion (keeshond / pug) + last visited location
// These drive the map screen — the Vespa puppet is the chosen companion,
// and it starts each session parked at the last location the user visited.
// ---------------------------------------------------------------------------

export function loadCompanion() {
  const store = loadStore();
  return store.companion || null;
}

export function saveCompanion(companion) {
  const store = loadStore();
  store.companion = companion;
  writeUserStore(store);
}

export function loadLastLocation() {
  const store = loadStore();
  return store.lastLocation || null;
}

export function saveLastLocation(locationId) {
  const store = loadStore();
  store.lastLocation = locationId;
  writeUserStore(store);
}
