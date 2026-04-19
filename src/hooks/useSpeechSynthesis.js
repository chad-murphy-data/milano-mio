// Italian character TTS.
//
// Calls /api/tts (OpenAI TTS-1-HD behind a Netlify proxy) with the voice
// assigned to the current character and plays the returned mp3 via an
// Audio element. Falls back to the browser's SpeechSynthesis API if the
// network call fails or if no voice is mapped for the character.
//
// The hook keeps an in-memory LRU cache (cap 40) so repeat lines — the
// deterministic intro stage direction, short acks like "Sì" / "Grazie" —
// don't re-bill or re-fetch. Cache resets on reload; use IndexedDB later
// if you want persistence.

import { useEffect, useRef, useState, useCallback } from 'react';
import { getVoiceFor } from '../data/characterVoices.js';
import { getSavedPassword } from '../utils/claudeApi.js';

const CACHE_CAP = 40;

// Shared across hook instances within a page — two different screens
// calling the hook with the same (voice, text) pair benefit from the
// same cache.
const audioCache = new Map(); // key -> blobUrl

function cacheKey(voice, styleHint, text) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${voice}|${styleHint || ''}|${normalized}`;
}

function cacheGet(key) {
  if (!audioCache.has(key)) return null;
  // Move to end (LRU touch)
  const url = audioCache.get(key);
  audioCache.delete(key);
  audioCache.set(key, url);
  return url;
}

function cacheSet(key, url) {
  audioCache.set(key, url);
  while (audioCache.size > CACHE_CAP) {
    const oldest = audioCache.keys().next().value;
    const oldestUrl = audioCache.get(oldest);
    audioCache.delete(oldest);
    try { URL.revokeObjectURL(oldestUrl); } catch {}
  }
}

// Strip narrative / stage-direction markup so TTS only pronounces the
// actual Italian dialogue. Claude is instructed not to emit these, but
// it occasionally slips — we defend in depth:
//   [bracketed]  — stage directions, stray tags
//   *asterisks*  — action narration like *pulls shot*
//   (parens)     — inline English glosses
//   ~tildes~     — legacy marker from earlier prompts
function cleanForTTS(text) {
  return text
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\*[^*]*\*/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/~[^~]*~/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Prime the audio layer on each user gesture until we confirm a successful
// play(). Browsers block new Audio().play() without an active gesture; the
// briefing → conversation handoff takes ~2s (Claude call + TTS fetch)
// which can push the original Andiamo click out of the "recent gesture"
// window. Playing a silent blip during any earlier click banks the
// permission so the first TTS clip isn't blocked.
//
// Previous version set the "primed" flag before the Audio.play() promise
// resolved — if that first attempt rejected, we'd still remove the
// listener and silently leave the audio layer locked, so the user's
// first TTS call would get punted to the Web Speech fallback (the
// "robotic woman" voice). Now we only set primed on a verified success,
// and re-try on every subsequent gesture until we succeed.
let audioLayerPrimed = false;
function primeAudioLayer() {
  if (audioLayerPrimed) return;
  try {
    const silent = new Audio(
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    );
    silent.volume = 0;
    const p = silent.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        audioLayerPrimed = true;
      }).catch(() => {
        // Leave primed=false so the next gesture tries again.
      });
    } else {
      audioLayerPrimed = true;
    }
  } catch {}
}
if (typeof window !== 'undefined') {
  const onGesture = () => {
    primeAudioLayer();
  };
  window.addEventListener('pointerdown', onGesture);
  window.addEventListener('keydown', onGesture);
}

export default function useSpeechSynthesis({ characterName, lang = 'it-IT' } = {}) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);
  const abortRef = useRef(null);
  const fallbackActive = useRef(false);
  // Queue of blob URLs waiting to play in order. Populated by queueSpeak;
  // drained by playNext(). A short pendingFetches counter keeps "speaking"
  // true while the next sentence is still synthesizing, so the caller
  // doesn't briefly think the turn ended mid-stream.
  const queueRef = useRef([]);
  const pendingFetchesRef = useRef(0);

  // Web Speech voices for fallback path.
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const pickFallbackVoice = useCallback(() => {
    if (!voices.length) return null;
    const italian = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('it'));
    return italian[0] || null;
  }, [voices]);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current = null;
    }
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
      abortRef.current = null;
    }
    if (fallbackActive.current && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    fallbackActive.current = false;
    queueRef.current = [];
    pendingFetchesRef.current = 0;
    // Drop the in-flight playback queue state. Previous version only
    // cleared a vestigial `queueRef` and never reset the queue that the
    // ordered playback actually uses (readyItemsRef / playingRef /
    // seq counters) — which meant a barge-in could leave playingRef
    // stuck true and starve the next turn's audio, or leave orphaned
    // items that played out of sequence.
    readyItemsRef.current.clear();
    playingRef.current = false;
    seqRef.current = 0;
    nextPlaySeqRef.current = 0;
    setSpeaking(false);
  }, []);

  const speakFallback = useCallback((text, rate) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickFallbackVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { fallbackActive.current = false; setSpeaking(false); };
    utterance.onerror = () => { fallbackActive.current = false; setSpeaking(false); };
    fallbackActive.current = true;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [lang, pickFallbackVoice]);

  const speak = useCallback(async (rawText, { rate = 1 } = {}) => {
    if (!rawText) return;
    const text = cleanForTTS(rawText);
    if (!text) return;

    cancel();

    const voiceCast = getVoiceFor(characterName);
    if (!voiceCast) {
      // No voice mapped — fall straight to browser TTS.
      speakFallback(text, rate);
      return;
    }
    const { voice, styleHint } = voiceCast;

    const key = cacheKey(voice, styleHint, text);
    const hit = cacheGet(key);
    if (hit) {
      playUrl(hit);
      return;
    }

    // Fresh synth — fetch audio bytes, cache, play.
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-app-password': getSavedPassword()
        },
        body: JSON.stringify({ text, voice, styleHint }),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      cacheSet(key, url);
      if (controller.signal.aborted) return;
      playUrl(url);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      // Network / upstream failure — degrade to browser TTS so the app
      // keeps talking even if TTS endpoint is down.
      console.warn('[TTS] fetch failed, falling back to browser voice:', err);
      speakFallback(text, rate);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }

    function playUrl(url) {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setSpeaking(true);
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null;
        setSpeaking(false);
      };
      audio.onerror = (e) => {
        console.warn('[TTS] audio element error:', e);
        if (audioRef.current === audio) audioRef.current = null;
        setSpeaking(false);
      };
      audio.play().catch((err) => {
        // Autoplay blocked — most likely cause is the user gesture is
        // too stale by the time we're ready to play.
        console.warn('[TTS] audio.play() blocked, falling back:', err);
        if (audioRef.current === audio) audioRef.current = null;
        setSpeaking(false);
        speakFallback(text, rate);
      });
    }
  }, [characterName, cancel, speakFallback]);

  // Serialized FIFO playback. Each queueSpeak call fires its TTS fetch
  // in parallel (so synthesis overlaps), but playback is ordered by the
  // call sequence — later sentences wait for earlier ones to finish,
  // even if a later fetch completes first. This preserves the natural
  // flow of "first sentence plays, second sentence starts, ..." while
  // still minimizing dead air between sentences.
  const seqRef = useRef(0);
  const nextPlaySeqRef = useRef(0);
  const readyItemsRef = useRef(new Map()); // seq -> { url, onStart, onEnd, text, rate }
  const playingRef = useRef(false);

  const tryPlayNext = useCallback(() => {
    if (playingRef.current) return;
    const next = readyItemsRef.current.get(nextPlaySeqRef.current);
    if (!next) return;
    readyItemsRef.current.delete(nextPlaySeqRef.current);
    nextPlaySeqRef.current += 1;

    // Synthetic fallback item — the fetch failed, so we skip the audio
    // element entirely and route straight to browser speech. Still fires
    // onStart so the UI surfaces the character line and the puppet
    // animates in sync with the fallback voice.
    if (!next.url) {
      try { next.onStart?.(); } catch {}
      if (next.text) speakFallback(next.text, next.rate);
      try { next.onEnd?.(); } catch {}
      tryPlayNext();
      return;
    }

    playingRef.current = true;
    const audio = new Audio(next.url);
    audioRef.current = audio;
    audio.onplay = () => {
      setSpeaking(true);
      try { next.onStart?.(); } catch {}
    };
    audio.onended = () => {
      if (audioRef.current === audio) audioRef.current = null;
      playingRef.current = false;
      try { next.onEnd?.(); } catch {}
      if (readyItemsRef.current.size === 0 && pendingFetchesRef.current === 0) {
        setSpeaking(false);
      }
      tryPlayNext();
    };
    audio.onerror = () => {
      if (audioRef.current === audio) audioRef.current = null;
      playingRef.current = false;
      tryPlayNext();
    };
    audio.play().catch((err) => {
      console.warn('[TTS] queued audio.play() blocked:', err);
      playingRef.current = false;
      if (audioRef.current === audio) audioRef.current = null;
      // Speech fallback keeps audio coming even if autoplay blocks us.
      if (next.text) speakFallback(next.text, next.rate);
      tryPlayNext();
    });
  }, [speakFallback]);

  const queueSpeak = useCallback(async (rawText, { onStart, onEnd, rate = 1 } = {}) => {
    if (!rawText) return;
    const text = cleanForTTS(rawText);
    if (!text) return;

    const mySeq = seqRef.current++;
    const voiceCast = getVoiceFor(characterName);
    if (!voiceCast) {
      // No mapped voice — fire onStart immediately and speak via Web Speech.
      try { onStart?.(); } catch {}
      speakFallback(text, rate);
      try { onEnd?.(); } catch {}
      return;
    }
    const { voice, styleHint } = voiceCast;
    const key = cacheKey(voice, styleHint, text);
    const cached = cacheGet(key);

    if (cached) {
      readyItemsRef.current.set(mySeq, { url: cached, onStart, onEnd, text, rate });
      tryPlayNext();
      return;
    }

    pendingFetchesRef.current += 1;
    const abortController = new AbortController();
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-app-password': getSavedPassword()
        },
        body: JSON.stringify({ text, voice, styleHint }),
        signal: abortController.signal
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      cacheSet(key, url);
      readyItemsRef.current.set(mySeq, { url, onStart, onEnd, text, rate });
      tryPlayNext();
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.warn('[TTS] queued fetch failed, falling back:', err);
      // Insert a "synthetic" ready item that uses the browser fallback when
      // its turn comes — this keeps the ordering contract intact.
      readyItemsRef.current.set(mySeq, {
        url: null,
        text,
        rate,
        onStart: () => {
          try { onStart?.(); } catch {}
          speakFallback(text, rate);
        },
        onEnd
      });
      tryPlayNext();
    } finally {
      pendingFetchesRef.current -= 1;
    }
  }, [characterName, speakFallback, tryPlayNext]);

  // Stop audio on unmount so navigating away from the conversation
  // immediately silences the character.
  useEffect(() => () => cancel(), [cancel]);

  return { speaking, speak, queueSpeak, cancel };
}
