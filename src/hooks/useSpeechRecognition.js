import { useEffect, useRef, useState, useCallback } from 'react';

// Toggle-mode speech recognition for Italian.
// Click once to start listening, click again to stop and get the transcript.
// Uses continuous mode so it doesn't cut off on pauses.
export default function useSpeechRecognition({ lang = 'it-IT' } = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef('');
  const resolverRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;      // keep listening through pauses
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      finalRef.current = finalText;
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error === 'aborted') return; // normal when we call stop()
      setError(e.error || 'speech-error');
    };

    rec.onend = () => {
      setListening(false);
      const text = finalRef.current.trim();
      setInterim('');
      if (resolverRef.current) {
        const resolve = resolverRef.current;
        resolverRef.current = null;
        resolve(text);
      }
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
    };
  }, [lang]);

  // Returns a promise that resolves with the full transcript when stop() is called.
  const start = useCallback(() => {
    if (!recognitionRef.current) return Promise.resolve('');
    finalRef.current = '';
    setError(null);
    setInterim('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // already started — ignore
    }
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
  }, []);

  return { supported, listening, interim, error, start, stop };
}
