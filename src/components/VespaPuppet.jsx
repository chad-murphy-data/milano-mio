// VespaPuppet — the dog-driven scooter shown on the map.
// Position is given in percentages (0–100) relative to the map canvas.
// The outer wrap animates `left/top` via CSS transition (for smooth travel
// between hotspots); the inner <img> runs a bojangle keyframe when driving.

import vespaKeeshond from '../assets/puppets/vespa_keeshond.png';
import vespaPug from '../assets/puppets/vespa_pug.png';

const VESPA_SRC = {
  keeshond: vespaKeeshond,
  pug: vespaPug,
};

export default function VespaPuppet({ companion, x, y, driving }) {
  const src = VESPA_SRC[companion] || vespaKeeshond;
  return (
    <div
      className={`vespa-wrap ${driving ? 'driving' : 'idle'}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    >
      <img
        src={src}
        alt={companion}
        className="vespa-puppet"
        draggable={false}
      />
    </div>
  );
}
