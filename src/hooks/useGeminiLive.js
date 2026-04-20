// React hook for a Gemini Live (realtime voice) session. Wraps the same
// flow the spike at /live-test.html proved out: mint an ephemeral token,
// open an authenticated WSS via the @google/genai SDK, capture mic →
// downsample to 16 kHz PCM → stream, receive PCM 24 kHz → play.
//
// Usage:
//   const { status, userTranscript, nonnaTranscript, turnCount, micOn,
//           toggleMic, disconnect, error } = useGeminiLive({
//     enabled: true,
//     systemInstruction,
//     voiceName: 'Aoede',
//     silenceMs: 300,
//     model: 'gemini-3.1-flash-live-preview',
//     onTurnComplete: (turnIdx) => { ... },
//     onClosed: () => { ... },
//   });

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSavedPassword } from '../utils/claudeApi.js';

// Import the SDK lazily so the main bundle doesn't pull it unless a Live
// scenario is actually started. `import()` in a promise gives us the
// ESM-style default at run time.
let genaiPromise = null;
function loadGenAI() {
  if (!genaiPromise) {
    genaiPromise = import('https://esm.sh/@google/genai@latest');
  }
  return genaiPromise;
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}
function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function floatToPcm16(floats) {
  const pcm = new Int16Array(floats.length);
  for (let i = 0; i < floats.length; i++) {
    const s = Math.max(-1, Math.min(1, floats[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}

function downsampleTo16k(input, srcRate) {
  if (srcRate === 16000) return input;
  const ratio = srcRate / 16000;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const startIdx = i * ratio;
    const endIdx = Math.min(input.length, Math.ceil((i + 1) * ratio));
    let sum = 0, count = 0;
    for (let j = Math.floor(startIdx); j < endIdx; j++) {
      sum += input[j]; count++;
    }
    out[i] = count > 0 ? sum / count : 0;
  }
  return out;
}

async function fetchToken() {
  const pw = getSavedPassword();
  const res = await fetch('/api/live-token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-app-password': pw }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Token ${res.status}: ${text}`);
  const data = JSON.parse(text);
  if (!data.token) throw new Error('Token missing from response');
  return data.token;
}

export default function useGeminiLive({
  enabled = false,
  systemInstruction = '',
  voiceName = 'Aoede',
  silenceMs = 300,
  model = 'gemini-3.1-flash-live-preview',
  characterName = 'Character',
  onTurnComplete,
  onClosed
} = {}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'closed' | 'error'
  // lines are committed turn-by-turn so the existing Transcript component
  // can render them as discrete speech bubbles. pendingUser/pendingCharacter
  // hold the mid-turn streamed text so the UI can show what the speaker
  // is saying before turnComplete fires and we finalize.
  const [lines, setLines] = useState([]);
  const [pendingUser, setPendingUser] = useState('');
  const [pendingCharacter, setPendingCharacter] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState(null);

  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const scriptNodeRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const micOnRef = useRef(true);
  const turnCompleteCbRef = useRef(onTurnComplete);
  const closedCbRef = useRef(onClosed);
  const userBufferRef = useRef('');
  const charBufferRef = useRef('');

  // Keep the latest callback refs without invalidating the connect closure.
  useEffect(() => { turnCompleteCbRef.current = onTurnComplete; }, [onTurnComplete]);
  useEffect(() => { closedCbRef.current = onClosed; }, [onClosed]);
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);

  const playAudioChunk = useCallback((base64) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    try {
      const bytes = base64ToBytes(base64);
      const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);
      const src = ctx.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(ctx.destination);
      const start = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      src.start(start);
      nextPlayTimeRef.current = start + audioBuffer.duration;
    } catch (e) {
      console.warn('[Live] playback error:', e);
    }
  }, []);

  const handleMessage = useCallback((msg) => {
    if (!msg) return;
    if (msg.setupComplete !== undefined) return;
    if (msg.serverContent) {
      const sc = msg.serverContent;
      if (sc.modelTurn) {
        const parts = sc.modelTurn.parts || [];
        for (const p of parts) {
          if (p.inlineData?.data && p.inlineData.mimeType?.startsWith('audio/')) {
            playAudioChunk(p.inlineData.data);
          }
        }
      }
      if (sc.inputTranscription?.text) {
        userBufferRef.current = (userBufferRef.current + sc.inputTranscription.text);
        setPendingUser(userBufferRef.current.trim());
      }
      if (sc.outputTranscription?.text) {
        charBufferRef.current = (charBufferRef.current + sc.outputTranscription.text);
        setPendingCharacter(charBufferRef.current.trim());
      }
      if (sc.turnComplete) {
        // Finalize the current turn: push user + character lines into the
        // transcript array and clear the in-progress buffers. Empty buffers
        // (e.g. if the character responded to text input, user buffer is
        // empty) don't produce a line.
        const userText = userBufferRef.current.trim();
        const charText = charBufferRef.current.trim();
        userBufferRef.current = '';
        charBufferRef.current = '';
        setPendingUser('');
        setPendingCharacter('');
        setLines((prev) => {
          const next = [...prev];
          if (userText) next.push({ role: 'user', text: userText });
          if (charText) next.push({ role: 'character', text: charText, english: null });
          return next;
        });
        setTurnCount((prev) => {
          const nextCount = prev + 1;
          try { turnCompleteCbRef.current?.(nextCount); } catch {}
          return nextCount;
        });
      }
    }
  }, [playAudioChunk]);

  const startMic = useCallback(async () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') await ctx.resume();
    audioContextRef.current = ctx;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, noiseSuppression: true, echoCancellation: true }
    });
    micStreamRef.current = stream;
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = (e) => {
      if (!micOnRef.current || !sessionRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const down = downsampleTo16k(input, ctx.sampleRate);
      const pcm = floatToPcm16(down);
      const base64 = bytesToBase64(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
      try {
        sessionRef.current.sendRealtimeInput({
          audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
        });
      } catch (err) {
        console.warn('[Live] send error:', err);
      }
    };
    source.connect(node);
    const sink = ctx.createGain();
    sink.gain.value = 0;
    node.connect(sink);
    sink.connect(ctx.destination);
    scriptNodeRef.current = node;
  }, []);

  const cleanup = useCallback(() => {
    try { scriptNodeRef.current?.disconnect(); } catch {}
    try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    try { audioContextRef.current?.close(); } catch {}
    try { sessionRef.current?.close(); } catch {}
    scriptNodeRef.current = null;
    micStreamRef.current = null;
    audioContextRef.current = null;
    sessionRef.current = null;
    nextPlayTimeRef.current = 0;
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus('closed');
    try { closedCbRef.current?.(); } catch {}
  }, [cleanup]);

  // Connect when `enabled` flips true. Cleans up on unmount / when disabled
  // flips back to false.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      console.log('[Live] connecting…');
      setStatus('connecting');
      setError(null);
      userBufferRef.current = '';
      charBufferRef.current = '';
      setPendingUser('');
      setPendingCharacter('');
      setLines([]);
      setTurnCount(0);
      try {
        const { GoogleGenAI, Modality } = await loadGenAI();
        if (cancelled) return;
        console.log('[Live] SDK loaded');
        const token = await fetchToken();
        if (cancelled) return;
        console.log('[Live] token acquired');

        const ai = new GoogleGenAI({
          apiKey: token,
          httpOptions: { apiVersion: 'v1alpha' }
        });

        const session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              languageCode: 'it-IT'
            },
            realtimeInputConfig: {
              automaticActivityDetection: { silenceDurationMs: silenceMs }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          },
          callbacks: {
            onopen: () => { /* logged via state */ },
            onmessage: (msg) => handleMessage(msg),
            onerror: (err) => {
              if (cancelled) return;
              console.warn('[Live] session error:', err);
              setError(err?.message || 'Live error');
              setStatus('error');
            },
            onclose: () => {
              if (cancelled) return;
              setStatus('closed');
              try { closedCbRef.current?.(); } catch {}
            }
          }
        });

        if (cancelled) { try { session.close(); } catch {} return; }
        sessionRef.current = session;

        try {
          await startMic();
        } catch (micErr) {
          console.warn('[Live] mic denied:', micErr);
          setError('Mic access denied. Grant microphone permission and try again.');
          setStatus('error');
          return;
        }

        setStatus('connected');
      } catch (e) {
        if (cancelled) return;
        console.warn('[Live] connect failed:', e);
        setError(e?.message || String(e));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
    // Connection lifecycle is tied strictly to `enabled`; other config
    // (systemInstruction, voice, silence) is read at connect time and
    // re-reading mid-session is intentionally not supported.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const toggleMic = useCallback(() => {
    setMicOn((prev) => !prev);
  }, []);

  // Send a typed message into the Live session. Mirrors what the test page
  // used to kick off the opening greeting, but exposed for the conversation
  // screen's typed-input form.
  const sendText = useCallback((text) => {
    if (!text?.trim()) return;
    const s = sessionRef.current;
    if (!s) return;
    try {
      s.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: text.trim() }] }],
        turnComplete: true
      });
      // Reflect the typed text immediately in the transcript, since
      // audio-input transcription won't fire for it.
      setLines((prev) => [...prev, { role: 'user', text: text.trim() }]);
    } catch (err) {
      console.warn('[Live] sendText failed:', err);
    }
  }, []);

  return {
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
  };
}
