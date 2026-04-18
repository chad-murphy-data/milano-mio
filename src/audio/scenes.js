// Scene → audio cue map. Keys match `route.screen` values from App.jsx, so
// any new route needs an entry here (or it falls through to silence).
//
//   track   — ID from tracks.js, or null for silence
//   volume  — target volume 0-1, scaled by masterVolume at runtime
//   loop    — loop indefinitely (defaults to true)
//   fadeMs  — override the crossfade duration when entering this scene
//
// Scenes that share a track (e.g. userPicker + home both play `title`)
// animate volume without reloading the audio, so the opening sequence
// feels like one continuous piece rather than a restart on every route.

export const DEFAULT_FADE_MS = 800;

export const SCENES = {
  // Opening sequence — title song, progressively quieter as the user
  // moves past the title card into setup screens.
  userPicker: { track: 'title', volume: 0.85, loop: true },
  home:       { track: 'title', volume: 0.7,  loop: true },

  // Main hub. City-stroll loop — the bed under everything map-related.
  map:        { track: 'mapLoop', volume: 0.6, loop: true },

  // Scenario flow. Briefing sets the scene with an ambient bed, the
  // conversation itself is silent so music never competes with STT/TTS,
  // and the debrief gets a soft resolution bed.
  briefing:     { track: 'scenarioAmbient', volume: 0.35, loop: true },
  conversation: { track: null },
  debrief:      { track: 'debriefBed', volume: 0.4, loop: true },

  // Conversazione Libera — Luca/Giulia are at a bar, lean into café ambience.
  clEntry:        { track: 'cafeBed', volume: 0.4, loop: true },
  clConversation: { track: null },
  clDebrief:      { track: 'debriefBed', volume: 0.4, loop: true },

  // Study mode — silent by design.
  vocabDashboard: { track: null },
};
