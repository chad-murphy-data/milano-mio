import { getVocabStats, STATES } from '../utils/vocabularyEngine.js';

const STATE_LABELS = {
  [STATES.NEW]: 'New',
  [STATES.LEARNING]: 'Learning',
  [STATES.FAMILIAR]: 'Familiar',
  [STATES.STRONG]: 'Strong'
};

const STATE_COLORS = {
  [STATES.NEW]: '#999',
  [STATES.LEARNING]: '#b5761f',
  [STATES.FAMILIAR]: '#3f7d4a',
  [STATES.STRONG]: '#1b6e2e'
};

export default function VocabularyDashboard({ vocabulary, onBack }) {
  const stats = getVocabStats(vocabulary || {});
  const allWords = Object.entries(vocabulary || {})
    .map(([word, entry]) => ({ word, ...entry }))
    .sort((a, b) => (a.word < b.word ? -1 : 1));

  return (
    <div className="screen vocab-screen">
      <button className="back-btn" onClick={onBack}>← Indietro</button>
      <h2>Vocabolario</h2>

      <div className="vocab-overview">
        <div className="vocab-total">
          <span className="big-number">{stats.total}</span>
          <span className="big-label">parole totali</span>
        </div>
        <div className="state-badges">
          {Object.entries(stats.byState).map(([state, count]) =>
            count > 0 ? (
              <span
                key={state}
                className="state-badge"
                style={{ backgroundColor: STATE_COLORS[state], color: 'white' }}
              >
                {STATE_LABELS[state]}: {count}
              </span>
            ) : null
          )}
        </div>
      </div>

      {stats.dueForReview > 0 && (
        <section className="vocab-section">
          <h3>Da ripassare ({stats.dueForReview})</h3>
          <p className="muted">These words are due for review.</p>
        </section>
      )}

      {stats.mostFumbled.length > 0 && (
        <section className="vocab-section">
          <h3>Le più difficili</h3>
          <ul className="fumble-list">
            {stats.mostFumbled.map(({ word, seenCount, correctCount }) => (
              <li key={word}>
                <span className="word">{word}</span>
                <span className="fumble-stat">
                  {correctCount}/{seenCount} correct
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {allWords.length > 0 && (
        <section className="vocab-section">
          <h3>Tutte le parole</h3>
          <table className="vocab-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>State</th>
                <th>Seen</th>
                <th>Correct</th>
              </tr>
            </thead>
            <tbody>
              {allWords.map(({ word, state, seenCount, correctCount }) => (
                <tr key={word}>
                  <td>{word}</td>
                  <td>
                    <span
                      className="state-dot"
                      style={{ color: STATE_COLORS[state] || '#999' }}
                    >
                      ● {STATE_LABELS[state] || state}
                    </span>
                  </td>
                  <td>{seenCount}</td>
                  <td>{correctCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {allWords.length === 0 && (
        <p className="muted" style={{ marginTop: 24 }}>
          No words yet. Complete a conversation to start building your vocabulary.
        </p>
      )}
    </div>
  );
}
