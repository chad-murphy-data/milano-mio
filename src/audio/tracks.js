// Track registry. Each value is a URL — typically an import from
// src/assets/audio/, or a hosted URL. null entries are stubs: the audio
// manager treats them as silence, so the app keeps working before the
// music is generated.
//
// To wire in a new track, drop the file under src/assets/audio/ and swap
// the null for an import, e.g.
//
//   import titleUrl from '../assets/audio/title.mp3';
//   ...
//   title: titleUrl,

import titleUrl from '../assets/audio/title.mp3';
import mapLoopUrl from '../assets/audio/map_loop.mp3';

export const TRACKS = {
  title: titleUrl,        // Hero theme — title card + picker screens
  mapLoop: mapLoopUrl,    // City-stroll loop under the world map
  scenarioAmbient: null,  // Generic café/street bed for briefings
  cafeBed: null,          // Bar ambience for Conversazione Libera
  debriefBed: null,       // Soft resolution loop after a conversation
};
