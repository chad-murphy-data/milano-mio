// Plays music for the current route. Scenes declare a track + target
// volume in src/audio/scenes.js; this hook handles the transitions:
// crossfading between different tracks, ducking volume when two scenes
// share a track, and silencing everything when `enabled` is false.
//
// Usage (in App.jsx):
//   useAudioManager(route.screen, { enabled: authed });
//
// Returns { muted, setMuted, toggleMuted, masterVolume, setMasterVolume }
// so a future UI control can drive user preferences.

import { useEffect, useRef, useState, useCallback } from 'react';
import { SCENES, DEFAULT_FADE_MS } from '../audio/scenes.js';
import { TRACKS } from '../audio/tracks.js';

const MUTE_KEY = 'milano-mio-audio-muted';
const VOLUME_KEY = 'milano-mio-audio-volume';

function loadBool(key, fallback) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return fallback; }
}
function saveBool(key, v) {
  try { window.localStorage.setItem(key, v ? '1' : '0'); } catch {}
}
function loadFloat(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  } catch { return fallback; }
}
function saveFloat(key, v) {
  try { window.localStorage.setItem(key, String(v)); } catch {}
}

// Linearly fade the element's volume toward `target` over `ms`. If the
// element is paused and we're fading up, we kick it off with .play() —
// any rejection (autoplay policy) is swallowed; the next gesture-driven
// scene change will retry.
function fadeTo(el, target, ms) {
  if (!el) return;
  if (el._fadeRaf) cancelAnimationFrame(el._fadeRaf);
  const start = el.volume;
  const t0 = performance.now();
  if (el.paused && target > 0) {
    el.play().catch(() => {});
  }
  const step = () => {
    const t = ms > 0 ? Math.min(1, (performance.now() - t0) / ms) : 1;
    el.volume = Math.max(0, Math.min(1, start + (target - start) * t));
    if (t < 1) {
      el._fadeRaf = requestAnimationFrame(step);
    } else {
      el._fadeRaf = null;
      if (target === 0) el.pause();
    }
  };
  el._fadeRaf = requestAnimationFrame(step);
}

export default function useAudioManager(sceneId, { enabled = true } = {}) {
  const [muted, setMutedState] = useState(() => loadBool(MUTE_KEY, false));
  const [masterVolume, setMasterVolumeState] = useState(() => loadFloat(VOLUME_KEY, 1));

  // Browsers block audio until the user interacts. The login submit is
  // itself a gesture so this usually flips before a music scene mounts,
  // but a reload into an already-authed state needs a click/keypress
  // first — we capture the next one and unblock from there.
  const [gestureSeen, setGestureSeen] = useState(false);
  useEffect(() => {
    if (gestureSeen) return;
    const mark = () => setGestureSeen(true);
    window.addEventListener('pointerdown', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('pointerdown', mark);
      window.removeEventListener('keydown', mark);
    };
  }, [gestureSeen]);

  // One HTMLAudioElement per track, lazily created the first time the
  // track is requested. { target } is the scene's unscaled volume, kept
  // so we can re-apply when masterVolume / muted change without losing
  // the scene's intent.
  const trackStateRef = useRef({});

  // volumeRef lets the scene-change effect read current master/mute
  // without taking them as deps (which would re-run the transition on
  // every volume tweak and re-fade the same track needlessly).
  const volumeRef = useRef({ muted, masterVolume });
  const effective = (target) =>
    volumeRef.current.muted ? 0 : target * volumeRef.current.masterVolume;

  const getOrCreate = (trackId) => {
    const url = TRACKS[trackId];
    if (!url) return null;
    const existing = trackStateRef.current[trackId];
    if (existing) return existing;
    const el = new Audio(url);
    el.preload = 'auto';
    el.volume = 0;
    const state = { el, target: 0 };
    trackStateRef.current[trackId] = state;
    return state;
  };

  // Scene transitions — fade out anything that isn't the new track,
  // fade in the new one (or just adjust volume if it was already active).
  useEffect(() => {
    const cue = SCENES[sceneId] || { track: null };
    const shouldPlay = enabled && gestureSeen;
    const targetTrack = shouldPlay ? cue.track : null;
    const fadeMs = cue.fadeMs ?? DEFAULT_FADE_MS;

    Object.entries(trackStateRef.current).forEach(([trackId, state]) => {
      if (trackId !== targetTrack) {
        state.target = 0;
        fadeTo(state.el, 0, fadeMs);
      }
    });

    if (targetTrack) {
      const state = getOrCreate(targetTrack);
      if (state) {
        state.el.loop = cue.loop !== false;
        state.target = cue.volume ?? 0.6;
        fadeTo(state.el, effective(state.target), fadeMs);
      }
    }
  }, [sceneId, enabled, gestureSeen]);

  // Instant-ish response to mute/master changes. 200ms fade keeps it
  // smooth without feeling laggy on a slider drag.
  useEffect(() => {
    volumeRef.current = { muted, masterVolume };
    Object.values(trackStateRef.current).forEach((state) => {
      if (state.target > 0) {
        fadeTo(state.el, effective(state.target), 200);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted, masterVolume]);

  // Tear down on unmount — stop all tracks and drop the srcs so the
  // browser can reclaim the decoded audio.
  useEffect(() => () => {
    Object.values(trackStateRef.current).forEach((state) => {
      if (state.el._fadeRaf) cancelAnimationFrame(state.el._fadeRaf);
      state.el.pause();
      state.el.src = '';
    });
    trackStateRef.current = {};
  }, []);

  const setMuted = useCallback((v) => {
    const next = Boolean(v);
    setMutedState(next);
    saveBool(MUTE_KEY, next);
  }, []);
  const toggleMuted = useCallback(() => {
    setMutedState((cur) => {
      const next = !cur;
      saveBool(MUTE_KEY, next);
      return next;
    });
  }, []);
  const setMasterVolume = useCallback((v) => {
    const bounded = Math.max(0, Math.min(1, Number(v) || 0));
    setMasterVolumeState(bounded);
    saveFloat(VOLUME_KEY, bounded);
  }, []);

  return { muted, setMuted, toggleMuted, masterVolume, setMasterVolume };
}
