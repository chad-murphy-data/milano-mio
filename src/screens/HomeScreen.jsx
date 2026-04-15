// HomeScreen — the dog picker. Shown on every page load so the user can
// easily swap companions, with a "Continua →" link to skip straight to the
// map if a companion is already saved. The currently-selected dog gets a
// subtle "Attuale" badge.

import vespaKeeshond from '../assets/puppets/vespa_keeshond.png';
import vespaPug from '../assets/puppets/vespa_pug.png';

const DOGS = [
  {
    id: 'keeshond',
    name: 'Il Keeshond',
    tagline: "Soffice, curioso, un po' lunatico — ama il vento sulla faccia.",
    src: vespaKeeshond,
  },
  {
    id: 'pug',
    name: 'Il Carlino',
    tagline: 'Piccolo, orgoglioso, molto italiano — un filo drammatico.',
    src: vespaPug,
  },
];

export default function HomeScreen({ onPickCompanion, existingCompanion, onContinue }) {
  return (
    <div className="screen home-screen home-picker">
      <header>
        <h1>Milano Mio</h1>
        <p className="subtitle">
          {existingCompanion
            ? 'Cambia compagno o continua il tuo viaggio.'
            : 'Scegli il tuo compagno di viaggio.'}
        </p>
      </header>

      <div className="dog-row">
        {DOGS.map((d) => {
          const isCurrent = existingCompanion === d.id;
          return (
            <button
              key={d.id}
              className={`dog-card ${isCurrent ? 'current' : ''}`}
              onClick={() => onPickCompanion(d.id)}
            >
              {isCurrent && <span className="dog-badge">Attuale</span>}
              <div className="dog-img-wrap">
                <img src={d.src} alt={d.name} className="dog-img" draggable={false} />
              </div>
              <h3>{d.name}</h3>
              <p>{d.tagline}</p>
            </button>
          );
        })}
      </div>

      {onContinue ? (
        <div className="picker-continue">
          <button className="link-btn" onClick={onContinue}>
            Continua alla mappa →
          </button>
        </div>
      ) : (
        <p className="picker-footnote">
          Puoi cambiare compagno in qualsiasi momento dalla mappa.
        </p>
      )}
    </div>
  );
}
