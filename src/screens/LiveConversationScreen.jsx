// LiveConversationScreen — realtime voice conversation via Gemini 3.1
// Flash Live, with the same pedagogical UI as the Claude+TTS
// ConversationScreen: collapsible briefing sidebar, tappable word marks
// for known/unknown vocab, on-demand per-line translation, and a typed
// input as an alternative to speaking.
//
// Translation uses the regular /api/marco endpoint lazily when the user
// clicks "show translation" — Live doesn't give us English glosses for
// free, so we translate the Italian transcript on demand and cache the
// result on the line.

import { useCallback, useEffect, useState } from 'react';
import useGeminiLive from '../hooks/useGeminiLive.js';
import { sendMessage, AuthError } from '../utils/claudeApi.js';
import BriefingPanel from '../components/BriefingPanel.jsx';
import Transcript from '../components/Transcript.jsx';
import sanSiroBackdrop from '../assets/scenes/sanSiroEntry_backdrop.png';
import nonnoAldoPuppet from '../assets/scenes/nonno_aldo.jpg';

// Chroma-key the puppet's magenta background once per mount and cache
// the blob URL across component instances.
let cachedPuppetUrl = null;
function chromaKeyMagenta(srcUrl) {
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
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const magentaScore = (r + b) / 2 - g;
        if (magentaScore > 55 && r > 160 && b > 160) {
          px[i + 3] = 0;
        } else if (magentaScore > 40 && r > 150 && b > 150) {
          const fade = (magentaScore - 40) / 15;
          px[i + 3] = Math.round(px[i + 3] * (1 - Math.min(1, fade)));
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

// Translate an Italian fragment to English via Claude. Cheap, sync-ish
// call — cached in memory by Italian text so subsequent "show translation"
// clicks on the same line don't re-bill.
const translationCache = new Map();
async function translateItalianToEnglish(italian) {
  if (!italian) return '';
  const cached = translationCache.get(italian);
  if (cached) return cached;
  try {
    const reply = await sendMessage(
      'You are a concise Italian-to-English translator. Reply with ONLY the natural English translation of the user\'s Italian input — no quotes, no explanation, no Italian, no prefixes.',
      [{ role: 'user', content: italian }],
      'normale'
    );
    const out = (reply || '').trim().replace(/^["'"]|["'"]$/g, '');
    translationCache.set(italian, out);
    return out;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    console.warn('[Live] translation failed:', e);
    return '';
  }
}

export default function LiveConversationScreen({ scenario, difficulty = 'facile', onEnd, onAuthLost }) {
  const live = scenario.live || {};
  const systemInstruction =
    scenario.buildSystemPrompt?.() || scenario.systemInstruction || '';

  const [sessionEnabled, setSessionEnabled] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [puppetUrl, setPuppetUrl] = useState(cachedPuppetUrl);
  const [typedInput, setTypedInput] = useState('');
  const [wordMarks, setWordMarks] = useState({});
  const [enrichedLines, setEnrichedLines] = useState([]);

  useEffect(() => {
    if (cachedPuppetUrl) return;
    let cancelled = false;
    chromaKeyMagenta(nonnoAldoPuppet)
      .then((url) => {
        cachedPuppetUrl = url;
        if (!cancelled) setPuppetUrl(url);
      })
      .catch(() => { /* puppet just won't render */ });
    return () => { cancelled = true; };
  }, []);

  const {
    status,
    lines,
    pendingUser,
    pendingCharacter,
    turnCount,
    micOn,
    toggleMic,
    sendText,
    disconnect,
    error
  } = useGeminiLive({
    enabled: sessionEnabled,
    systemInstruction,
    voiceName: live.voiceName || 'Aoede',
    silenceMs: live.silenceMs || 300,
    model: live.model || 'gemini-3.1-flash-live-preview',
    characterName: scenario.characterName,
    onTurnComplete: (turnIdx) => {
      const max = live.maxTurns || 3;
      if (turnIdx >= max) {
        setTimeout(() => {
          setSessionEnabled(false);
          setHasEnded(true);
        }, 1500);
      }
    },
    onClosed: () => setHasEnded(true)
  });

  // Mirror `lines` into a local state so we can mutate english glosses as
  // translations resolve without bouncing back through the hook.
  useEffect(() => {
    setEnrichedLines((prev) => {
      const next = lines.map((ln, i) => {
        const existing = prev[i];
        if (existing && existing.text === ln.text && existing.role === ln.role) {
          return existing; // preserve any fetched english
        }
        return { ...ln };
      });
      return next;
    });
  }, [lines]);

  // Append pending in-progress text as a "ghost" line so the user sees
  // real-time streaming text while the current turn is still landing.
  const displayLines = [
    ...enrichedLines,
    ...(pendingUser ? [{ role: 'user', text: pendingUser, pending: true }] : []),
    ...(pendingCharacter ? [{ role: 'character', text: pendingCharacter, pending: true }] : [])
  ];

  const handleWordTap = (key) => {
    setWordMarks((prev) => {
      const current = prev[key] || null;
      const next = current === null ? 'unknown' : current === 'unknown' ? 'known' : null;
      const updated = { ...prev };
      if (next) updated[key] = next; else delete updated[key];
      return updated;
    });
  };

  const handleTypedSubmit = async (e) => {
    e.preventDefault();
    const text = typedInput.trim();
    if (!text || status !== 'connected') return;
    setTypedInput('');
    sendText(text);
  };

  const handleEndClick = () => {
    setSessionEnabled(false);
    disconnect();
    setHasEnded(true);
  };

  // Lazy translate: called from Transcript when user clicks "show translation".
  // We inject an `english` gloss onto the matching line so TranslationReveal
  // actually has something to show. Pass down via a custom line prop that
  // triggers the translation if english is a function/promise.
  //
  // Our existing Transcript component expects `english` to be a static
  // string; rather than rewriting it, we pre-translate each character line
  // the first time it appears. Cheap API call, cached in-memory, happens
  // once per distinct line.
  useEffect(() => {
    enrichedLines.forEach((line, idx) => {
      if (line.role !== 'character' || line.english || !line.text) return;
      translateItalianToEnglish(line.text)
        .then((english) => {
          if (!english) return;
          setEnrichedLines((prev) => {
            if (prev[idx]?.english) return prev; // already set
            if (prev[idx]?.text !== line.text) return prev; // stale
            const next = [...prev];
            next[idx] = { ...next[idx], english };
            return next;
          });
        })
        .catch((err) => {
          if (err instanceof AuthError) onAuthLost?.();
        });
    });
  }, [enrichedLines, onAuthLost]);

  // Collect marked words when the session ends, hand off for the (eventual)
  // vocab engine integration along with the final transcript.
  const collectMarkedWords = useCallback(() => {
    const known = [];
    const unknown = [];
    for (const [key, mark] of Object.entries(wordMarks)) {
      const [lineIdx, wIdx] = key.split('-').map(Number);
      const line = enrichedLines[lineIdx];
      if (!line || line.role === 'user') continue;
      const words = line.text.split(/(\s+)/).filter((t) => !/^\s*$/.test(t));
      const word = words[wIdx];
      if (!word) continue;
      const clean = word.replace(/[.,!?;:"""''()[\]]/g, '').toLowerCase();
      if (!clean) continue;
      if (mark === 'known') known.push(clean);
      else if (mark === 'unknown') unknown.push(clean);
    }
    return { known: [...new Set(known)], unknown: [...new Set(unknown)] };
  }, [wordMarks, enrichedLines]);

  useEffect(() => {
    if (!hasEnded) return;
    const marked = collectMarkedWords();
    const t = setTimeout(() => {
      onEnd?.({
        debrief: {
          learned: marked.known,
          retry: marked.unknown,
          [scenario.characterSaysKey || 'character_says']:
            'Buona partita! (realtime voice session)',
          transitionTo: null
        },
        transcript: enrichedLines
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [hasEnded, onEnd, scenario.characterSaysKey, enrichedLines, collectMarkedWords]);

  const statusLabel = {
    idle: 'Starting…',
    connecting: 'Connecting…',
    connected: `Live — turn ${turnCount + 1} / ${live.maxTurns || 3}`,
    closed: 'Conversation ended',
    error: 'Error'
  }[status] || status;

  return (
    <div className={`screen conversation-screen live-conversation-screen ${panelOpen ? 'panel-open' : ''}`}>
      <div className="conversation-main">
        <div className="puppet-theater">
          <div className="theater-inner">
            <div className="scene-header">
              <h2>{scenario.title}</h2>
              <button className="end-btn" onClick={handleEndClick} disabled={hasEnded}>
                Termina
              </button>
            </div>

            <div className="live-stage">
              <img
                src={sanSiroBackdrop}
                alt="San Siro biglietteria"
                className="live-backdrop"
              />
              {puppetUrl && (
                <div
                  className={`live-puppet ${status === 'connected' ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${puppetUrl})` }}
                  aria-label={scenario.characterName || 'Character'}
                  role="img"
                />
              )}
              <div className="live-status-chip">
                <span className={`live-dot ${status === 'connected' ? 'on' : ''}`} />
                {statusLabel}
              </div>
            </div>

            {error && <div className="warning">{error}</div>}

            {displayLines.length === 0 && status === 'connected' && (
              <div className="live-empty-hint">
                Dì "Buonasera!" o "Ecco il biglietto" — Aldo ascolta mentre parli e risponde quando fai una pausa.
              </div>
            )}
            {displayLines.length > 0 && (
              <Transcript
                lines={displayLines}
                characterName={scenario.characterName || 'Character'}
                wordMarks={wordMarks}
                onWordTap={handleWordTap}
              />
            )}

            <div className="input-row">
              <button
                className={`mic-toggle ${micOn ? 'on' : 'off'}`}
                onClick={toggleMic}
                disabled={status !== 'connected'}
              >
                {micOn ? '🎙 Mic open' : '🔇 Muted'}
              </button>
              <span className="input-divider">oppure</span>
              <form className="type-form" onSubmit={handleTypedSubmit}>
                <input
                  type="text"
                  className="type-input"
                  placeholder="Scrivi in italiano..."
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={status !== 'connected'}
                />
                <button
                  type="submit"
                  className="type-send"
                  disabled={status !== 'connected' || !typedInput.trim()}
                >
                  Invia
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <BriefingPanel
        open={panelOpen}
        onToggle={() => setPanelOpen((p) => !p)}
        scenario={scenario}
        difficulty={difficulty}
      />
    </div>
  );
}
