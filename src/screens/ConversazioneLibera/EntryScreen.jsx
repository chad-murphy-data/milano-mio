import { useState } from 'react';

export default function CLEntryScreen({ character, characterData, onStart, onBack }) {
  const [difficulty, setDifficulty] = useState('facile');

  if (!character) return null;

  const sessions = characterData?.sessionCount || 0;
  const lastTopic = characterData?.lastTopic;

  return (
    <div className="screen cl-entry-screen">
      <button className="back-btn" onClick={onBack}>← Indietro</button>
      <h2>{character.title}</h2>
      <p>{character.shortDescription}</p>

      <div className="cl-info">
        {sessions === 0 ? (
          <p className="cl-first">Prima conversazione!</p>
        ) : (
          <p className="cl-returning">
            {sessions} conversazion{sessions === 1 ? 'e' : 'i'} finora
            {lastTopic && <span> · Last time: {lastTopic}</span>}
          </p>
        )}
        <p className="cl-teaser">
          {character.name} ha qualcosa in mente...
        </p>
      </div>

      <div className="difficulty-row">
        {['facile', 'normale', 'difficile'].map((d) => (
          <button
            key={d}
            className={`diff-btn ${difficulty === d ? 'active' : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <button className="primary-btn" onClick={() => onStart(difficulty)}>
        Inizia
      </button>
    </div>
  );
}
