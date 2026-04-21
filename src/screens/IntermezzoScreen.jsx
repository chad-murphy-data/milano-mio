// IntermezzoScreen — the bridge between two chained Live scenarios.
// When a scenario ends with `live.chainTo` set (e.g. bartoliniLive →
// bartoliniSommelierLive), App routes here instead of to the debrief.
// We show the incoming character + a brief Italian narration to set
// up the handoff, then a "Continua →" button to launch the next
// phase's conversation. No briefing panel — the user already saw
// the full briefing for the chain root and shouldn't have to re-read
// vocab between phases.

import { useEffect, useState } from 'react';

// Glob the head puppets so we can preview the incoming character.
// Same convention as LiveConversationScreen — files at
// src/assets/puppets/{key}_head.png.
const rawHeads = import.meta.glob('../assets/puppets/*_head.png', { eager: true });
const heads = (() => {
  const map = {};
  for (const [path, mod] of Object.entries(rawHeads)) {
    const file = path.split('/').pop();
    const key = file.replace('_head.png', '');
    map[key] = mod.default;
  }
  return map;
})();

function characterKeyFor(scenario) {
  const cfg = scenario?.live?.puppet || {};
  if (cfg.characterKey) return cfg.characterKey;
  return (scenario?.characterName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function IntermezzoScreen({ toScenario, intermezzoText, onContinue }) {
  const [revealed, setRevealed] = useState(false);

  // Tiny entry animation — fade in after mount so the new character
  // doesn't pop in cold.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(t);
  }, []);

  const charKey = characterKeyFor(toScenario);
  const headSrc = heads[charKey] || null;

  return (
    <div className={`screen intermezzo-screen ${revealed ? 'revealed' : ''}`}>
      <div className="intermezzo-card">
        {headSrc && (
          <img
            src={headSrc}
            alt={toScenario.characterName || 'Character'}
            className="intermezzo-puppet"
          />
        )}
        <div className="intermezzo-text">
          <h2 className="intermezzo-character">{toScenario.characterName}</h2>
          {intermezzoText && (
            <p className="intermezzo-narration">{intermezzoText}</p>
          )}
          <button className="intermezzo-continue" onClick={onContinue}>
            Continua →
          </button>
        </div>
      </div>
    </div>
  );
}
