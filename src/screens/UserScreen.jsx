// UserScreen — who's learning today? Chad and Charlie each get their own
// scoped store (sessions, vocab, companion). Guest is ephemeral: nothing is
// written to localStorage and the in-memory store resets on every selection.

import { USERS } from '../hooks/useLocalStorage.js';

const OPTIONS = [
  {
    id: USERS.CHAD,
    name: 'Chad',
    tagline: 'Il tuo progresso, sempre salvato.',
  },
  {
    id: USERS.CHARLIE,
    name: 'Charlie',
    tagline: 'Il tuo progresso, sempre salvato.',
  },
  {
    id: USERS.GUEST,
    // Kept in English so non-Italian speakers can spot the escape hatch at a glance.
    name: 'Guest',
    tagline: 'Un giro senza impegno — niente viene salvato.',
  },
];

export default function UserScreen({ currentUser, onPickUser, onCancel }) {
  return (
    <div className="screen home-screen user-picker">
      <header>
        <h1>Milano Mio</h1>
        <p className="subtitle">Chi impara oggi?</p>
      </header>

      <div className="user-row">
        {OPTIONS.map((u) => {
          const isCurrent = currentUser === u.id;
          return (
            <button
              key={u.id}
              className={`user-card ${isCurrent ? 'current' : ''} ${u.id === USERS.GUEST ? 'guest' : ''}`}
              onClick={() => onPickUser(u.id)}
            >
              {isCurrent && <span className="dog-badge">Attuale</span>}
              <h3>{u.name}</h3>
              <p>{u.tagline}</p>
            </button>
          );
        })}
      </div>

      {onCancel && (
        <div className="picker-continue">
          <button className="link-btn" onClick={onCancel}>
            ← Annulla
          </button>
        </div>
      )}
    </div>
  );
}
