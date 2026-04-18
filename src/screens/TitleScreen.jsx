// TitleScreen — the first thing a visitor sees each session. A hero
// illustration of Milano (Duomo skyline, Vespa + dog in the corner) with
// a layer of drifting watercolor clouds over the sky area. Clicking
// "Entra" arms audio (the click is the gesture that unblocks autoplay),
// fades the title out, then hands off to the rest of the app.
//
// A session-scoped flag in sessionStorage means reloading inside a tab
// skips the title (no forced re-click), but a fresh session — new tab,
// next day — shows it again so the opening still feels intentional.

import { useEffect, useState } from 'react';
import titleBackdrop from '../assets/scenes/title_backdrop.png';
import titleClouds from '../assets/scenes/title_clouds.jpg';
import titleLogo from '../assets/scenes/title_logo.png';

// Cache processed blob URLs across mounts so we don't re-run chroma
// keying on every navigation back to the title.
let chromaKeyedCloudsUrl = null;
let chromaKeyedLogoUrl = null;

// Generic chroma-key with soft edges. The predicate returns an alpha
// multiplier (0..1): 0 for pixels to erase, 1 for fully opaque content,
// in-between for anti-aliased edge pixels so we don't get a hard pink or
// green halo around shapes. Gemini exports with baked-in chroma bgs
// rather than real alpha; this processes them client-side and caches
// the resulting blob URL so subsequent mounts skip the work.
function chromaKey(srcUrl, alphaMultiplier) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const mult = alphaMultiplier(px[i], px[i + 1], px[i + 2]);
        if (mult < 1) {
          px[i + 3] = Math.round(px[i + 3] * mult);
        }
      }
      ctx.putImageData(data, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('toBlob failed'));
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = srcUrl;
  });
}

// Magenta fade: narrow edge-fade band so we only touch pixels that are
// clearly on the chroma-key side of the transition. A wider band was
// eating into cream cloud highlights and leaving ghost clouds in the sky.
// Score 55+: fully transparent. Score 40-55: proportional fade (AA
// edges). Below 40: fully opaque (real cloud content preserved).
const magentaAlpha = (r, g, b) => {
  const score = (r + b) / 2 - g;
  if (score > 55 && r > 160 && b > 160) return 0;
  if (score > 40 && r > 150 && b > 150) {
    return Math.max(0, 1 - (score - 40) / 15);
  }
  return 1;
};

// Green fade: mirror of the magenta logic for the logo PNG.
const greenAlpha = (r, g, b) => {
  const score = g - (r + b) / 2;
  if (score > 55 && g > 150) return 0;
  if (score > 40 && g > 140) {
    return Math.max(0, 1 - (score - 40) / 15);
  }
  return 1;
};

export default function TitleScreen({ onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const [cloudsUrl, setCloudsUrl] = useState(chromaKeyedCloudsUrl);
  const [logoUrl, setLogoUrl] = useState(chromaKeyedLogoUrl);

  useEffect(() => {
    let cancelled = false;
    if (!chromaKeyedCloudsUrl) {
      chromaKey(titleClouds, greenAlpha)
        .then((url) => {
          chromaKeyedCloudsUrl = url;
          if (!cancelled) setCloudsUrl(url);
        })
        .catch(() => { /* clouds stay hidden */ });
    }
    if (!chromaKeyedLogoUrl) {
      chromaKey(titleLogo, greenAlpha)
        .then((url) => {
          chromaKeyedLogoUrl = url;
          if (!cancelled) setLogoUrl(url);
        })
        .catch(() => { /* falls back to h1 text in JSX */ });
    }
    return () => { cancelled = true; };
  }, []);

  // Hold on the title for a beat after the click so the music (which only
  // starts now, after the gesture) has time to swell before we advance.
  const handleEnter = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onEnter(), 1400);
  };

  return (
    <div className={`screen title-screen ${leaving ? 'leaving' : ''}`}>
      <div className="title-inner">
        <img
          src={titleBackdrop}
          className="title-backdrop"
          alt="Watercolor illustration of Milan rooftops with the Duomo"
        />
        {cloudsUrl && (
          <>
            <div
              className="title-clouds title-clouds-left"
              aria-hidden="true"
              style={{ backgroundImage: `url(${cloudsUrl})` }}
            />
            <div
              className="title-clouds title-clouds-right"
              aria-hidden="true"
              style={{ backgroundImage: `url(${cloudsUrl})` }}
            />
          </>
        )}
        <div className="title-overlay">
          {logoUrl ? (
            <div className="title-logo-halo">
              <img
                src={logoUrl}
                className="title-logo"
                alt="Milano Mio — il tuo viaggio inizia qui."
              />
            </div>
          ) : (
            <>
              <h1 className="title-brand">Milano Mio</h1>
              <p className="title-subtitle">Il tuo viaggio inizia qui.</p>
            </>
          )}
        </div>

        <div className="title-button-wrap">
          <button
            className="primary-btn title-enter"
            onClick={handleEnter}
            disabled={leaving}
          >
            Entra →
          </button>
        </div>
      </div>
    </div>
  );
}
