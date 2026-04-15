import { useEffect, useRef, useState } from 'react';
import { scenarios, storyOrder } from '../data/scenarios.js';
import * as lucaData from '../data/conversazioneLibera/luca.js';
import * as giuliaData from '../data/conversazioneLibera/giulia.js';
import { mapLocations, START_POSITION } from '../data/mapLocations.js';
import VespaPuppet from '../components/VespaPuppet.jsx';
import worldMap from '../assets/scenes/world_map.png';

const CL_CHARACTERS = [lucaData, giuliaData];

// Duration the Vespa takes to bojangle from its current spot to the picked
// location before we hand off to the briefing screen. Keep this in sync with
// `.vespa-wrap` transition-duration in index.css.
const DRIVE_DURATION_MS = 3600;

export default function MapScreen({
  companion,
  lastLocation,
  onStartStory,
  onStartCL,
  onOpenVocab,
  onChangeCompanion,
  store,
}) {
  // Difficulty is set once for the whole map — it applies to whichever
  // scenario the user picks. Per-scenario toggles felt like busywork.
  const [difficulty, setDifficulty] = useState('facile');

  // Vespa position. Start at the last visited location (if any), otherwise
  // the START_POSITION parking spot at bottom-center.
  const initial =
    lastLocation && mapLocations[lastLocation]
      ? mapLocations[lastLocation]
      : START_POSITION;
  const [pos, setPos] = useState({ x: initial.x, y: initial.y });
  const [driving, setDriving] = useState(false);
  const [pending, setPending] = useState(null);
  const driveTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(driveTimerRef.current), []);

  const sessionsFor = (loc) =>
    (store?.sessions || []).filter((s) => s.location === loc);

  const characterSessions = (charId) =>
    (store?.sessions || []).filter((s) => s.location === `cl_${charId}`);

  const handlePick = (scenarioId) => {
    if (driving) return;
    const loc = mapLocations[scenarioId];
    if (!loc) return;

    setPending(scenarioId);
    setDriving(true);
    setPos({ x: loc.x, y: loc.y });

    clearTimeout(driveTimerRef.current);
    driveTimerRef.current = setTimeout(() => {
      setDriving(false);
      onStartStory(scenarioId, difficulty);
    }, DRIVE_DURATION_MS);
  };

  return (
    <div className="screen map-screen">
      <header className="map-header">
        <h1>Milano Mio</h1>
        <p className="subtitle">Dove andiamo oggi?</p>
      </header>

      <div className="map-difficulty" role="radiogroup" aria-label="Difficoltà">
        {['facile', 'normale', 'difficile'].map((d) => (
          <button
            key={d}
            role="radio"
            aria-checked={difficulty === d}
            className={`diff-btn ${difficulty === d ? 'active' : ''}`}
            onClick={() => setDifficulty(d)}
            disabled={driving}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <div className="map-canvas">
        <img
          src={worldMap}
          alt="Milano"
          className="map-image"
          draggable={false}
        />

        {storyOrder.map((id) => {
          const loc = mapLocations[id];
          if (!loc) return null;
          const visited = sessionsFor(id).length > 0;
          const isTarget = pending === id;
          return (
            <button
              key={id}
              type="button"
              className={`map-hotspot ${visited ? 'visited' : ''} ${isTarget ? 'target' : ''}`}
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
              onClick={() => handlePick(id)}
              disabled={driving}
              title={scenarios[id]?.title}
            >
              <span className="hotspot-dot" />
              <span className="hotspot-label">{loc.label}</span>
            </button>
          );
        })}

        <VespaPuppet
          companion={companion}
          x={pos.x}
          y={pos.y}
          driving={driving}
        />
      </div>

      {/* Conversazione Libera — talk to a character directly */}
      <section className="map-section">
        <h2>Conversazione Libera</h2>
        <div className="cl-row">
          {CL_CHARACTERS.map(({ character }) => {
            const sessions = characterSessions(character.id);
            return (
              <button
                key={character.id}
                className="cl-chip"
                onClick={() => onStartCL(character.id)}
                disabled={driving}
              >
                <span className="cl-chip-name">{character.name}</span>
                <span className="cl-chip-meta">
                  {sessions.length === 0
                    ? 'Prima conversazione'
                    : `${sessions.length} conversazion${sessions.length === 1 ? 'e' : 'i'}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="map-footer">
        <button className="link-btn" onClick={onOpenVocab} disabled={driving}>
          Vocabolario →
        </button>
        <button className="link-btn" onClick={onChangeCompanion} disabled={driving}>
          Cambia compagno →
        </button>
      </div>
    </div>
  );
}
