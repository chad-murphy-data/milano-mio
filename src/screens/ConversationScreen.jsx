import { useEffect, useRef, useState } from 'react';
import { sendMessage, AuthError } from '../utils/claudeApi.js';
import { parseResponse } from '../utils/debriefParser.js';
import useSpeechRecognition from '../hooks/useSpeechRecognition.js';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis.js';
import BriefingPanel from '../components/BriefingPanel.jsx';
import MicButton from '../components/MicButton.jsx';
import Transcript from '../components/Transcript.jsx';
import WhisperPrompt from '../components/WhisperPrompt.jsx';
import PuppetStage from '../components/PuppetStage.jsx';

export default function ConversationScreen({
  scenario,
  difficulty,
  retryWords = [],
  onEnd,
  onAuthLost,
  isCL = false,
  lifeline
}) {
  const systemPrompt = useRef(
    scenario.buildSystemPrompt(difficulty, retryWords)
  );
  const [messages, setMessages] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(!isCL && difficulty === 'facile');
  const [whisperHint, setWhisperHint] = useState(null);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [lifelineWords, setLifelineWords] = useState(null);
  const [wordMarks, setWordMarks] = useState({});
  const silenceTimer = useRef(null);
  const turnCount = useRef(0);
  const micPromise = useRef(null);
  const [ending, setEnding] = useState(false);
  const endingRef = useRef(false);

  const characterName = scenario.characterName || 'Marco';
  const whisperHints = scenario.whisperHints || [];

  const { supported, listening, interim, start, stop } = useSpeechRecognition();
  const { speak, cancel: cancelSpeech, speaking } = useSpeechSynthesis();
  const [fallbackTalking, setFallbackTalking] = useState(false);

  // Kick off conversation — character speaks first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const stageDirection = scenario.stageDirection || '[The conversation begins.]';
        const text = await sendMessage(
          systemPrompt.current,
          [{ role: 'user', content: stageDirection }],
          difficulty
        );
        if (cancelled) return;
        const { spoken, hint, english } = parseResponse(text);
        setMessages([
          { role: 'user', content: stageDirection },
          { role: 'assistant', content: text }
        ]);
        setLines([{ role: 'character', text: spoken, english: english || null }]);
        if (hint) {
          lastHint.current = `Try: "${hint}"`;
          setWhisperHint(`Try: "${hint}"`);
        }
        speak(spoken);
      } catch (e) {
        if (e instanceof AuthError) {
          onAuthLost?.();
          return;
        }
        setError(e.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive puppet "talking" state: active whenever TTS is speaking OR for up
  // to 3s after a new character line arrives (fallback for browsers with
  // no / slow speech synthesis).
  useEffect(() => {
    const last = lines[lines.length - 1];
    if (!last || last.role !== 'character') return;
    setFallbackTalking(true);
    const t = setTimeout(() => setFallbackTalking(false), 3000);
    return () => clearTimeout(t);
  }, [lines]);
  const isTalking = speaking || fallbackTalking;
  const latestCharacterLine = [...lines].reverse().find((l) => l.role === 'character');
  const speechText = isTalking && latestCharacterLine ? latestCharacterLine.text : '';

  // Whisper hint on silence (Easy mode, story mode only).
  // Uses the AI-provided hint from the last response (stored in lastHint ref).
  const lastHint = useRef(null);
  useEffect(() => {
    if (isCL || difficulty !== 'facile') return;
    if (loading || listening) {
      setWhisperHint(null);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      return;
    }
    silenceTimer.current = setTimeout(() => {
      if (lastHint.current) {
        setWhisperHint(lastHint.current);
      }
    }, 5000);
    return () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, [loading, listening, lines, difficulty, isCL]);

  const handleMicToggle = async () => {
    if (loading) return;
    if (listening) {
      stop();
    } else {
      setWhisperHint(null);
      cancelSpeech();
      micPromise.current = start();
      const transcript = await micPromise.current;
      if (transcript && transcript.trim()) {
        await submitUserText(transcript.trim());
      }
    }
  };

  const handleTypedSubmit = async (e) => {
    e.preventDefault();
    const text = typedInput.trim();
    if (!text || loading) return;
    setTypedInput('');
    cancelSpeech();
    await submitUserText(text);
  };

  const submitUserText = async (userText) => {
    turnCount.current += 1;
    const nextMessages = [...messages, { role: 'user', content: userText }];
    setMessages(nextMessages);
    setLines((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    setError(null);
    try {
      const text = await sendMessage(systemPrompt.current, nextMessages, difficulty);
      let { spoken, debrief, characterMemory, hint, english } = parseResponse(text);
      // If the user asked to end but the character didn't cooperate by emitting
      // a debrief, fabricate one so we exit after their farewell line plays.
      if (endingRef.current && !debrief) {
        debrief = {
          learned: [],
          retry: [],
          [scenario.characterSaysKey || 'character_says']: 'Conversazione terminata.',
          transitionTo: null
        };
      }
      setMessages([...nextMessages, { role: 'assistant', content: text }]);
      if (hint) {
        lastHint.current = `Try: "${hint}"`;
      }
      if (spoken) {
        setLines((prev) => [...prev, { role: 'character', text: spoken, english: english || null }]);
        speak(spoken);
      }
      if (debrief) {
        setTimeout(() => {
          const marked = collectMarkedWords();
          const mergedLearned = [
            ...(debrief.learned || []),
            ...marked.known.filter((w) => !(debrief.learned || []).some((l) => l.toLowerCase().startsWith(w)))
          ];
          const mergedRetry = [
            ...(debrief.retry || []),
            ...marked.unknown.filter((w) => !(debrief.retry || []).some((r) => r.toLowerCase().startsWith(w)))
          ];
          onEnd({
            debrief: { ...debrief, learned: mergedLearned, retry: mergedRetry },
            transcript: [
              ...lines,
              { role: 'user', text: userText },
              { role: 'character', text: spoken }
            ],
            characterMemory,
            lifelineUsed
          });
        }, 3500);
      }
    } catch (e) {
      if (e instanceof AuthError) {
        onAuthLost?.();
        return;
      }
      setError(e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndClick = async () => {
    // Second click (or click while AI is processing) = hard exit right now.
    // First click while idle = graceful end: give the character one more turn.
    if (endingRef.current || loading) {
      hardExit();
      return;
    }
    endingRef.current = true;
    setEnding(true);
    await submitUserText('Grazie, devo andare. Arrivederci!');
  };

  const hardExit = () => {
    cancelSpeech();
    const marked = collectMarkedWords();
    onEnd({
      debrief: {
        learned: marked.known,
        retry: marked.unknown,
        [scenario.characterSaysKey || 'character_says']: 'Conversazione terminata.',
        transitionTo: null
      },
      transcript: lines,
      characterMemory: null,
      lifelineUsed
    });
  };

  const handleWordTap = (key, token) => {
    setWordMarks((prev) => {
      const current = prev[key] || null;
      const next = current === null ? 'unknown' : current === 'unknown' ? 'known' : null;
      const updated = { ...prev };
      if (next) updated[key] = next;
      else delete updated[key];
      return updated;
    });
  };

  const collectMarkedWords = () => {
    const known = [];
    const unknown = [];
    for (const [key, mark] of Object.entries(wordMarks)) {
      const [lineIdx, wIdx] = key.split('-').map(Number);
      const line = lines[lineIdx];
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
  };

  const handleLifeline = () => {
    if (lifelineUsed || !lifeline?.words?.length) return;
    setLifelineUsed(true);
    setLifelineWords(lifeline.words);
    setTimeout(() => setLifelineWords(null), 8000);
  };

  return (
    <div className={`screen conversation-screen ${panelOpen ? 'panel-open' : ''}`}>
      <div className="conversation-main">
        <div className="puppet-theater">
          <div className="theater-inner">
            <div className="scene-header">
              <h2>{scenario.title}</h2>
              <button
                className="end-btn"
                onClick={handleEndClick}
                disabled={loading && !ending}
              >
                {ending ? 'Esci adesso' : 'Termina conversazione'}
              </button>
            </div>

            <PuppetStage
              characterName={characterName}
              characterKey={characterName.toLowerCase()}
              backdropKey={scenario.id}
              isTalking={isTalking}
              speechText={speechText}
            />

            {!supported && (
              <div className="warning">
                Your browser doesn't support Web Speech API. Try Chrome or Edge.
              </div>
            )}
            {error && <div className="warning">Errore: {error}</div>}

            <Transcript
              lines={lines}
              characterName={characterName}
              wordMarks={wordMarks}
              onWordTap={handleWordTap}
            />

            {!isCL && difficulty === 'facile' && <WhisperPrompt hint={whisperHint} />}

            {/* Lifeline for CL mode */}
            {isCL && lifeline?.words?.length > 0 && !lifelineUsed && (
              <button className="lifeline-btn" onClick={handleLifeline}>
                Aiuto! (usa una volta)
              </button>
            )}
            {lifelineWords && (
              <div className="lifeline-words">
                <span className="lifeline-label">Le tue parole difficili:</span>
                {lifelineWords.map((w) => (
                  <span key={w} className="lifeline-word">{w}</span>
                ))}
              </div>
            )}

            <div className="input-row">
              <MicButton
                listening={listening}
                disabled={loading || !supported}
                onToggle={handleMicToggle}
                interim={interim}
              />
              <span className="input-divider">oppure</span>
              <form className="type-form" onSubmit={handleTypedSubmit}>
                <input
                  type="text"
                  className="type-input"
                  placeholder="Scrivi in italiano..."
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="type-send" disabled={loading || !typedInput.trim()}>
                  Invia
                </button>
              </form>
            </div>
            {loading && <div className="loading">{characterName} sta pensando...</div>}
          </div>
        </div>
      </div>

      {/* Briefing panel — story mode only */}
      {!isCL && (
        <BriefingPanel
          open={panelOpen}
          onToggle={() => setPanelOpen((p) => !p)}
          scenario={scenario}
          difficulty={difficulty}
        />
      )}
    </div>
  );
}
