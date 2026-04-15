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
// App store — sessions, vocabulary, character memory
// ---------------------------------------------------------------------------

const STORE_KEY = 'milano-mio-store';

function defaultStore() {
  return { schemaVersion: 2, sessions: [], vocabulary: {}, characters: {} };
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
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  return store;
}

export function loadStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return defaultStore();
    const store = JSON.parse(raw);
    return migrateStore(store);
  } catch {
    return defaultStore();
  }
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
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
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
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
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
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function loadLastLocation() {
  const store = loadStore();
  return store.lastLocation || null;
}

export function saveLastLocation(locationId) {
  const store = loadStore();
  store.lastLocation = locationId;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}
