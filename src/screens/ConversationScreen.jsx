import { useEffect, useRef, useState, useCallback } from 'react';
import { sendMessageStream, AuthError } from '../utils/claudeApi.js';
import { parseResponse } from '../utils/debriefParser.js';
import useSpeechRecognition from '../hooks/useSpeechRecognition.js';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis.js';
import BriefingPanel from '../components/BriefingPanel.jsx';
import MicButton from '../components/MicButton.jsx';
import Transcript from '../components/Transcript.jsx';
import WhisperPrompt from '../components/WhisperPrompt.jsx';
import PuppetStage from '../components/PuppetStage.jsx';

// Match a complete sentence terminated by one or more of . ! ? (plus trailing
// whitespace or end-of-string). Used to pull finished sentences out of the
// streaming Claude response so we can fire TTS for each as it completes,
// instead of waiting for the whole reply.
const SENTENCE_RE = /^(.+?[.!?]+)(\s+|$)/s;

function cleanFragmentForDisplay(text) {
  // The on-screen character line strips Claude's control blocks just like the
  // TTS input does, so text that flashes into the transcript never contains
  // `[HINT: ...]` or `[ENGLISH: ...]`.
  return text.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
}

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
  const { queueSpeak, cancel: cancelSpeech, speaking } = useSpeechSynthesis({ characterName });
  const [fallbackTalking, setFallbackTalking] = useState(false);

  // Monotonically increasing counter so a new turn can invalidate any
  // still-running stream/TTS work from the previous one. Incremented on
  // every mic toggle, typed submit, and end-click — anywhere the user
  // would barge in on the character.
  const turnSeqRef = useRef(0);

  // Stream a Claude response and fire TTS per sentence as soon as each
  // sentence closes (on `.`, `!`, `?`). The UI does not add a character
  // line until the first audio clip actually starts — so the puppet isn't
  // "talking" to silence while we're still waiting for TTS to return.
  //
  // Returns the parsed response (spoken/debrief/hint/english/memory) so the
  // caller can persist results and transition out of the turn.
  const runStreamedTurn = useCallback(async (messagesForClaude, { onCancelled } = {}) => {
    const mySeq = ++turnSeqRef.current;
    const isCancelled = () => turnSeqRef.current !== mySeq || Boolean(onCancelled?.());
    const stream = sendMessageStream(systemPrompt.current, messagesForClaude, difficulty);

    let fullText = '';
    let speakablePos = 0;      // how far into fullText we've pulled for TTS
    let pendingSentence = '';  // buffer of characters awaiting a sentence end
    let tagReached = false;    // once we see a `[`, everything after is tags
    const lineIdxRef = { current: null };

    const showSentence = (sentenceText) => {
      const clean = cleanFragmentForDisplay(sentenceText);
      if (!clean) return;
      if (lineIdxRef.current == null) {
        // First audible sentence — create the character line now, at the
        // moment the puppet actually has something to say.
        setLines((prev) => {
          lineIdxRef.current = prev.length;
          return [...prev, { role: 'character', text: clean, english: null }];
        });
      } else {
        // Append to the existing line as subsequent sentences land.
        setLines((prev) => {
          const next = [...prev];
          const idx = lineIdxRef.current;
          if (idx != null && next[idx]) {
            const prior = next[idx].text || '';
            next[idx] = {
              ...next[idx],
              text: prior ? `${prior} ${clean}` : clean
            };
          }
          return next;
        });
      }
    };

    const enqueueSentence = (sentenceText) => {
      if (!sentenceText.trim()) return;
      if (isCancelled()) return;
      queueSpeak(sentenceText, {
        onStart: () => {
          if (isCancelled()) return;
          showSentence(sentenceText);
        }
      });
    };

    try {
      for await (const token of stream) {
        if (isCancelled()) return null;
        fullText += token;
        if (tagReached) continue;

        // Speakable region is everything up to the first `[` (tags live
        // after dialogue). Anything past that boundary belongs to
        // [HINT: ...], [ENGLISH: ...], or [DEBRIEF].
        const tagIdx = fullText.indexOf('[');
        const speakableEnd = tagIdx === -1 ? fullText.length : tagIdx;
        if (speakableEnd > speakablePos) {
          pendingSentence += fullText.slice(speakablePos, speakableEnd);
          speakablePos = speakableEnd;
        }

        let match;
        while ((match = pendingSentence.match(SENTENCE_RE))) {
          enqueueSentence(match[1]);
          pendingSentence = pendingSentence.slice(match[0].length);
        }

        if (tagIdx !== -1) {
          // Flush any trailing partial sentence right before the tag block.
          const tail = pendingSentence.trim();
          if (tail) enqueueSentence(tail);
          pendingSentence = '';
          tagReached = true;
        }
      }
    } catch (e) {
      throw e;
    }

    // End of stream — flush anything we held back waiting for a boundary.
    if (!tagReached && pendingSentence.trim()) {
      enqueueSentence(pendingSentence);
    }

    const parsed = parseResponse(fullText);

    // Safety: if TTS never managed to call onStart (network down, no
    // Italian fallback voice, etc.), surface the line as text so the
    // user isn't left staring at a silent puppet.
    if (lineIdxRef.current == null && parsed.spoken) {
      setTimeout(() => {
        if (turnSeqRef.current !== mySeq) return;
        if (lineIdxRef.current != null) return;
        setLines((prev) => {
          lineIdxRef.current = prev.length;
          return [...prev, { role: 'character', text: cleanFragmentForDisplay(parsed.spoken), english: parsed.english || null }];
        });
      }, 1500);
    }

    return { fullText, parsed };
  }, [difficulty, queueSpeak]);

  // Kick off conversation — character speaks first. Streams Claude's
  // response and fires TTS per sentence so the first audible word lands
  // while Claude is still generating the rest.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const stageDirection = scenario.stageDirection || '[The conversation begins.]';
        const result = await runStreamedTurn(
          [{ role: 'user', content: stageDirection }],
          { onCancelled: () => cancelled }
        );
        if (cancelled || !result) return;
        const { fullText, parsed } = result;
        const { hint, english } = parsed;
        setMessages([
          { role: 'user', content: stageDirection },
          { role: 'assistant', content: fullText }
        ]);
        // If the character line was created by streaming, attach the english
        // gloss now that the full response has parsed.
        setLines((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'character') {
            next[next.length - 1] = { ...last, english: english || null };
          }
          return next;
        });
        if (hint) {
          lastHint.current = `Try: "${hint}"`;
          setWhisperHint(`Try: "${hint}"`);
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

  // Barge-in: invalidate any in-flight streaming turn AND stop current
  // audio. Both pieces are needed — cancelSpeech clears the playback
  // queue, but without bumping the turn counter, a still-streaming
  // Claude response would keep enqueueing fresh sentences on top.
  const bargeIn = useCallback(() => {
    turnSeqRef.current++;
    cancelSpeech();
  }, [cancelSpeech]);

  const handleMicToggle = async () => {
    if (loading) return;
    if (listening) {
      stop();
    } else {
      setWhisperHint(null);
      bargeIn();
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
    bargeIn();
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
      const result = await runStreamedTurn(nextMessages);
      if (!result) return;
      const { fullText, parsed } = result;
      let { spoken, debrief, characterMemory, hint, english } = parsed;
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
      setMessages([...nextMessages, { role: 'assistant', content: fullText }]);
      if (hint) {
        lastHint.current = `Try: "${hint}"`;
      }
      // Attach the English gloss to the character line the stream created.
      setLines((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'character') {
          next[next.length - 1] = { ...last, english: english || null };
        }
        return next;
      });
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
    bargeIn();
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
