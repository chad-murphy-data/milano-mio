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
  return { schemaVersion: 2, sessions: [], vocabulary: {}, characters: {} };
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
 * Migrate Sprint 1 schema → Sprint 2.
 * Sprint 1 vocab entries: { seen, correct, nextReview }
 * Sprint 2 vocab entries: { state, seenCount, correctCount, lastSeen, nextReview, location }
 */
function migrateStore(store) {
  if (store.schemaVersion >= 2) return store;

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
  writeUserStore(store);
  return store;
}

export function loadStore() {
  return migrateStore(readUserStore());
}

export function saveSession(session) {
  const store = loadStore();
  store.sessions.push(session);
  store.vocabulary = processSessionResults(
    store.vocabulary,
    session.learned || [],
    session.retry || [],
    session.location
  );
  writeUserStore(store);
  return store;
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
