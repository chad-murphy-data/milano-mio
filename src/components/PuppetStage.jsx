import { useEffect, useRef, useState } from 'react';

// ── Dynamic asset loading via Vite glob ───────────────────────────
// Each glob eagerly imports every matching file. At build time Vite
// replaces these with hashed URLs — no manual import per puppet.

const rawHeads = import.meta.glob('../assets/puppets/*_head.png', { eager: true });
const rawJaws = import.meta.glob('../assets/puppets/*_jaw.png', { eager: true });
const rawMetas = import.meta.glob('../assets/puppets/*_jaw_meta.json', { eager: true });
const rawBackdrops = import.meta.glob('../assets/scenes/*_backdrop.png', { eager: true });

function buildLookup(glob, suffix) {
  const map = {};
  for (const [path, mod] of Object.entries(glob)) {
    const file = path.split('/').pop();
    const key = file.replace(suffix, '');
    map[key] = mod.default;
  }
  return map;
}

const heads = buildLookup(rawHeads, '_head.png');
const jaws = buildLookup(rawJaws, '_jaw.png');
const metas = buildLookup(rawMetas, '_jaw_meta.json');
const backdrops = buildLookup(rawBackdrops, '_backdrop.png');

// ── Special-case mappings ─────────────────────────────────────────
// San Siro has "Vendor / Giuseppe" as characterName → two-part key
const CHARACTER_KEY_MAP = {
  'vendor / giuseppe': 'vendor',
};
const BACKDROP_KEY_MAP = {
  sanSiro: 'sanSiro_exterior',
};

// Fallback puppet / backdrop if a key isn't found
const FALLBACK_PUPPET = 'marco';
const FALLBACK_BACKDROP = 'caffe';

// ── Component ─────────────────────────────────────────────────────

export default function PuppetStage({
  characterName = 'Marco',
  characterKey: rawCharKey = 'marco',
  backdropKey: rawBackdropKey = 'caffe',
  isTalking = false,
  speechText = ''
}) {
  const [jawOpen, setJawOpen] = useState(false);
  const jawOpenRef = useRef(false);

  useEffect(() => {
    if (!isTalking) {
      setJawOpen(false);
      jawOpenRef.current = false;
      return undefined;
    }

    let timeout;
    const flap = () => {
      const nextOpen = !jawOpenRef.current;
      jawOpenRef.current = nextOpen;
      setJawOpen(nextOpen);
      const delay = nextOpen
        ? 120 + Math.random() * 160
        : 80 + Math.random() * 100;
      timeout = setTimeout(flap, delay);
    };

    timeout = setTimeout(flap, 50);
    return () => clearTimeout(timeout);
  }, [isTalking]);

  // Resolve keys through special-case maps then fallback
  const puppetKey = CHARACTER_KEY_MAP[rawCharKey] || rawCharKey;
  const sceneKey = BACKDROP_KEY_MAP[rawBackdropKey] || rawBackdropKey;

  const headSrc = heads[puppetKey] || heads[FALLBACK_PUPPET];
  const jawSrc = jaws[puppetKey] || jaws[FALLBACK_PUPPET];
  const meta = metas[puppetKey] || metas[FALLBACK_PUPPET];
  const backdrop = backdrops[sceneKey] || backdrops[FALLBACK_BACKDROP];

  // Convert jaw bbox to CSS percentages
  const { canvas, jawBbox } = meta;
  const jawStyle = {
    left: `${(jawBbox.left / canvas.width) * 100}%`,
    top: `${(jawBbox.top / canvas.height) * 100}%`,
    width: `${(jawBbox.width / canvas.width) * 100}%`,
    height: `${(jawBbox.height / canvas.height) * 100}%`
  };

  return (
    <div className="puppet-stage">
      <img className="stage-backdrop" src={backdrop} alt="" />
      <div className={`puppet ${isTalking ? 'puppet-talking' : 'puppet-idle'}`}>
        <div className="puppet-sprite-container">
          <img
            src={headSrc}
            alt={characterName}
            className="puppet-layer puppet-head"
          />
          <img
            src={jawSrc}
            alt=""
            aria-hidden="true"
            className={`puppet-layer puppet-jaw ${jawOpen ? 'open' : ''}`}
            style={jawStyle}
          />
        </div>
      </div>
      {speechText && (
        <div className="speech-bubble" key={speechText}>
          <span className="speech-text">{speechText}</span>
          <span className="speech-tail" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
