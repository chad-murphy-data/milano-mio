import { useEffect, useRef, useState } from 'react';
import { scenarios, storyOrder } from '../data/scenarios.js';
import * as lucaData from '../data/conversazioneLibera/luca.js';
import * as giuliaData from '../data/conversazioneLibera/giulia.js';
import { mapLocations, START_POSITION } from '../data/mapLocations.js';
import VespaPuppet from '../components/VespaPuppet.jsx';
import worldMap from '../assets/scenes/world_map.png';

const CL_CHARACTERS = [lucaData, giuliaData];

// Drive timeline for a hotspot pick:
//   t=0            Vespa starts driving, bojangle animation runs
//   t=TRAVEL_MS    Vespa arrives, bojangle stops, settles into idle wobble
//   t=FADE_START   Fade overlay starts covering the screen (crossfade lead-in)
//   t=DRIVE_END    Briefing screen takes over behind the opaque overlay
//
// Keep the CSS `.vespa-wrap` transition-duration in sync with TRAVEL_MS.
const DRIVE_DURATION_MS = 3600;
const SETTLE_MS = 500;            // still at destination before handoff
const FADE_LEAD_MS = 300;         // overlay fades in this much early
const TRAVEL_MS = DRIVE_DURATION_MS - SETTLE_MS; // 3100 (matches CSS)

export default function MapScreen({
  companion,
  lastLocation,
  onStartStory,
  onStartCL,
  onOpenVocab,
  onChangeCompanion,
  onBeforeStart,
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
  const settleTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const driveTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(settleTimerRef.current);
    clearTimeout(fadeTimerRef.current);
    clearTimeout(driveTimerRef.current);
  }, []);

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

    // Vespa arrives + stops bouncing before the screen changes — gives
    // the scooter a "parked" beat at the destination.
    clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => setDriving(false), TRAVEL_MS);

    // Fade overlay starts fading in during the settle — the map gently
    // dissolves into the briefing screen instead of cutting.
    clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(
      () => onBeforeStart?.(),
      DRIVE_DURATION_MS - FADE_LEAD_MS
    );

    // Hand off to briefing once the overlay is fully opaque.
    clearTimeout(driveTimerRef.current);
    driveTimerRef.current = setTimeout(
      () => onStartStory(scenarioId, difficulty),
      DRIVE_DURATION_MS
    );
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
