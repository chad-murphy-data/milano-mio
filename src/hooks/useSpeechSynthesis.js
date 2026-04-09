import { useEffect, useRef, useState, useCallback } from 'react';

// Wraps browser SpeechSynthesis for Italian TTS (Marco's voice).
export default function useSpeechSynthesis({ lang = 'it-IT' } = {}) {
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const currentUtterance = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const pickVoice = useCallback(() => {
    if (!voices.length) return null;
    const italian = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('it'));
    // Prefer a male-ish voice if we can detect one by name, else first italian.
    const malePreferred = italian.find((v) => /luca|giorgio|diego|marco|male/i.test(v.name));
    return malePreferred || italian[0] || null;
  }, [voices]);

  const speak = useCallback(
    (text, { rate = 1 } = {}) => {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
      // Strip parenthetical English glosses and ~stage directions~ so TTS sounds Italian-only.
      const italianOnly = text.replace(/\([^)]*\)/g, '').replace(/~[^~]*~/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(italianOnly);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      currentUtterance.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [lang, pickVoice]
  );

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { voices, speaking, speak, cancel };
}
