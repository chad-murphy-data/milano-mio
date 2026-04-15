// HomeScreen — the dog picker. Only shown on first visit (or when the user
// explicitly clicks "Cambia compagno" on the map). Picking a dog saves the
// companion to localStorage and hands off to the map.

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

export default function HomeScreen({ onPickCompanion }) {
  return (
    <div className="screen home-screen home-picker">
      <header>
        <h1>Milano Mio</h1>
        <p className="subtitle">Scegli il tuo compagno di viaggio.</p>
      </header>

      <div className="dog-row">
        {DOGS.map((d) => (
          <button
            key={d.id}
            className="dog-card"
            onClick={() => onPickCompanion(d.id)}
          >
            <div className="dog-img-wrap">
              <img src={d.src} alt={d.name} className="dog-img" draggable={false} />
            </div>
            <h3>{d.name}</h3>
            <p>{d.tagline}</p>
          </button>
        ))}
      </div>

      <p className="picker-footnote">
        Puoi cambiare compagno in qualsiasi momento dalla mappa.
      </p>
    </div>
  );
}
