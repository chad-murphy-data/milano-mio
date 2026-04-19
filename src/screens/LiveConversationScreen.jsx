// LiveConversationScreen — realtime voice conversation via Gemini 3.1
// Flash Live. Used for scenarios flagged `mode: 'live'` (currently just
// the San Siro biglietteria nonna).
//
// No puppet animation yet (no nonna art generated) and no structured
// debrief — on session end, we hand control back to the map with a
// light transcript record. Puppet + debrief can layer on later without
// reshaping this component.

import { useEffect, useState } from 'react';
import useGeminiLive from '../hooks/useGeminiLive.js';
import sanSiroBackdrop from '../assets/scenes/sanSiro_exterior_backdrop.png';

// System prompts live on scenario modules. The screen reads the prompt
// string and live-specific config (voice, silence, maxTurns) off the
// passed `scenario` object.
export default function LiveConversationScreen({ scenario, onEnd, onAuthLost }) {
  const live = scenario.live || {};
  const systemInstruction =
    scenario.buildSystemPrompt?.() || scenario.systemInstruction || '';

  const [sessionEnabled, setSessionEnabled] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  const {
    status,
    userTranscript,
    nonnaTranscript,
    turnCount,
    micOn,
    toggleMic,
    disconnect,
    error
  } = useGeminiLive({
    enabled: sessionEnabled,
    systemInstruction,
    voiceName: live.voiceName || 'Aoede',
    silenceMs: live.silenceMs || 300,
    model: live.model || 'gemini-3.1-flash-live-preview',
    onTurnComplete: (turnIdx) => {
      // Auto-end when the nonna finishes her configured number of beats.
      // maxTurns counts assistant turns; once she's said her Nth line,
      // she's supposed to have waved the user in already.
      const max = live.maxTurns || 3;
      if (turnIdx >= max) {
        setTimeout(() => {
          setSessionEnabled(false);
          setHasEnded(true);
        }, 1500);
      }
    },
    onClosed: () => {
      setHasEnded(true);
    }
  });

  const handleEndClick = () => {
    setSessionEnabled(false);
    disconnect();
    setHasEnded(true);
  };

  // Once the session has closed (naturally or via End), hand back to map
  // with a lightweight transcript record. Short delay so the final audio
  // clip actually plays out.
  useEffect(() => {
    if (!hasEnded) return;
    const t = setTimeout(() => {
      onEnd?.({
        debrief: {
          learned: [],
          retry: [],
          [scenario.characterSaysKey || 'nonna_says']:
            'Buona partita! (realtime voice session)',
          transitionTo: null
        },
        transcript: [
          ...(userTranscript ? [{ role: 'user', text: userTranscript }] : []),
          ...(nonnaTranscript ? [{ role: 'character', text: nonnaTranscript }] : [])
        ]
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [hasEnded, onEnd, scenario.characterSaysKey, userTranscript, nonnaTranscript]);

  const statusLabel = {
    idle: 'Starting…',
    connecting: 'Connecting…',
    connected: `Live — turn ${turnCount + 1} / ${live.maxTurns || 3}`,
    closed: 'Conversation ended',
    error: 'Error'
  }[status] || status;

  return (
    <div className="screen live-conversation-screen">
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
        <div className="live-status-chip">
          <span className={`live-dot ${status === 'connected' ? 'on' : ''}`} />
          {statusLabel}
        </div>
      </div>

      {error && (
        <div className="warning">
          {error}
        </div>
      )}

      <div className="live-transcript">
        {nonnaTranscript && (
          <div className="transcript-turn character">
            <div className="transcript-who">Nonna</div>
            <div className="transcript-text">{nonnaTranscript}</div>
          </div>
        )}
        {userTranscript && (
          <div className="transcript-turn user">
            <div className="transcript-who">Tu</div>
            <div className="transcript-text">{userTranscript}</div>
          </div>
        )}
        {!nonnaTranscript && !userTranscript && status === 'connected' && (
          <div className="transcript-hint">
            Say "Ciao!" or "Ecco il biglietto" — the nonna listens while you talk and replies when you pause.
          </div>
        )}
      </div>

      <div className="live-controls">
        <button
          className={`mic-toggle ${micOn ? 'on' : 'off'}`}
          onClick={toggleMic}
          disabled={status !== 'connected'}
        >
          {micOn ? '🎙 Mic open' : '🔇 Muted'}
        </button>
      </div>
    </div>
  );
}
