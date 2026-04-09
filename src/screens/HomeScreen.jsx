import { useState } from 'react';
import { scenarios, storyOrder } from '../data/scenarios.js';
import * as lucaData from '../data/conversazioneLibera/luca.js';
import * as giuliaData from '../data/conversazioneLibera/giulia.js';

const CL_CHARACTERS = [lucaData, giuliaData];

export default function HomeScreen({ onStartStory, onStartCL, onOpenVocab, store }) {
  const [difficulties, setDifficulties] = useState(
    () => Object.fromEntries(storyOrder.map((id) => [id, 'facile']))
  );

  const sessionsFor = (location) =>
    (store?.sessions || []).filter((s) => s.location === location);

  const characterSessions = (charId) =>
    (store?.sessions || []).filter((s) => s.location === `cl_${charId}`);

  return (
    <div className="screen home-screen">
      <header>
        <h1>Milano Mio</h1>
        <p className="subtitle">Il tuo viaggio inizia qui.</p>
      </header>

      {/* ---- Story Mode ---- */}
      <section className="home-section">
        <h2>La Storia</h2>
        {storyOrder.map((id) => {
          const sc = scenarios[id];
          const completed = sessionsFor(id).length > 0;
          const diff = difficulties[id] || 'facile';
          return (
            <div key={id} className="scenario-card">
              <div className="card-header">
                <h3>{sc.title}</h3>
                {completed && <span className="badge-done">✓</span>}
              </div>
              <p>{sc.shortDescription}</p>
              <div className="difficulty-row">
                {['facile', 'normale', 'difficile'].map((d) => (
                  <button
                    key={d}
                    className={`diff-btn ${diff === d ? 'active' : ''}`}
                    onClick={() => setDifficulties((prev) => ({ ...prev, [id]: d }))}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <button
                className="primary-btn"
                onClick={() => onStartStory(id, diff)}
              >
                Inizia
              </button>
            </div>
          );
        })}
      </section>

      {/* ---- Conversazione Libera ---- */}
      <section className="home-section">
        <h2>Conversazione Libera</h2>
        {CL_CHARACTERS.map(({ character }) => {
          const sessions = characterSessions(character.id);
          const charData = store?.characters?.[character.id];
          const lastDate = charData?.lastTopic
            ? sessions[sessions.length - 1]?.date
            : null;
          return (
            <div key={character.id} className="scenario-card cl-card">
              <h3>{character.title}</h3>
              <p>{character.shortDescription}</p>
              <p className="cl-meta">
                {sessions.length === 0
                  ? 'First conversation'
                  : `${sessions.length} conversation${sessions.length !== 1 ? 's' : ''}${lastDate ? ` · last: ${new Date(lastDate).toLocaleDateString()}` : ''}`}
              </p>
              <button className="primary-btn" onClick={() => onStartCL(character.id)}>
                Inizia
              </button>
            </div>
          );
        })}
      </section>

      {/* ---- Vocab link ---- */}
      <div className="home-footer">
        <button className="link-btn" onClick={onOpenVocab}>
          Vocabolario →
        </button>
      </div>
    </div>
  );
}
