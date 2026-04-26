// Scenario registry — single lookup point for all story mode scenarios.
// Screens receive a scenario object as a prop; they never import data files directly.

import * as caffeLive from './caffeLive.js';
import * as hotelLive from './hotelLive.js';
import * as metroLive from './metroLive.js';
import * as duomoLive from './duomoLive.js';
import * as mercatoLive from './mercatoLive.js';
import * as trattoriaLive from './trattoriaLive.js';
import * as navigliLive from './navigliLive.js';
import * as casaMilanLive from './casaMilanLive.js';
import * as sanSiroVendorLive from './sanSiroVendorLive.js';
import * as sanSiroMatchLive from './sanSiroMatchLive.js';
import * as bartoliniLive from './bartoliniLive.js';
import * as bartoliniSommelierLive from './bartoliniSommelierLive.js';
import * as viaDellaSpigasLive from './viaDellaSpigasLive.js';
import * as sanSiroEntry from './sanSiroEntry.js';
import * as gabriellaApartment from './gabriellaApartment.js';

function register(mod, characterName, characterSaysKey, stageDirection) {
  return {
    ...mod.scenario,
    keyPhrases: mod.keyPhrases,
    coreVocab: mod.coreVocab,
    extendedVocab: mod.extendedVocab,
    buildSystemPrompt: mod.buildSystemPrompt,
    whisperHints: mod.whisperHints,
    characterName,
    characterSaysKey,
    stageDirection
  };
}

export const scenarios = {
  hotelLive: register(hotelLive, 'Giulia', 'giulia_says',
    '[Chad arrives at the hotel reception desk with luggage. Giulia is finishing a phone call.]'),
  caffeLive: register(caffeLive, 'Marco', 'marco_says',
    '[Chad walks up to the bar. Marco is pulling shots.]'),
  metroLive: register(metroLive, 'Davide', 'davide_says',
    '[Chad is standing at a ticket machine in Cadorna metro station. Davide notices and offers to help.]'),
  duomoLive: register(duomoLive, 'Francesca', 'francesca_says',
    '[Chad approaches the tourist information point in Piazza del Duomo. Francesca welcomes him.]'),
  mercatoLive: register(mercatoLive, 'Rosa', 'rosa_says',
    '[Chad approaches Rosa\'s market stall on a weekday morning. Rosa beams.]'),
  trattoriaLive: register(trattoriaLive, 'Lorenzo', 'lorenzo_says',
    '[Chad arrives at the trattoria entrance for their dinner reservation. Lorenzo greets them at the door.]'),
  navigliLive: register(navigliLive, 'Sofia', 'sofia_says',
    '[Chad sits down at a canal-side table at a bar in the Navigli district. Sofia approaches with a warm welcome.]'),
  viaDellaSpigasLive: register(viaDellaSpigasLive, 'Valentina', 'valentina_says',
    '[Chad enters an elegant boutique on Via della Spiga. Valentina greets him from a display near the entrance.]'),
  casaMilanLive: register(casaMilanLive, 'Paolo', 'paolo_says',
    '[Chad enters Casa Milan. Paolo is arranging jerseys near the entrance and lights up at a fellow fan.]'),
  bartoliniLive: register(bartoliniLive, 'Alessandro', 'alessandro_says',
    '[Chad arrives at Enrico Bartolini al MUDEC. Alessandro greets him at the podium with measured warmth.]'),
  bartoliniSommelierLive: register(bartoliniSommelierLive, 'Elena', 'elena_says',
    '[Elena, the sommelier, arrives at the table to begin the wine pairing.]'),
  sanSiroVendorLive: register(sanSiroVendorLive, 'Vendor', 'vendor_says',
    '[Chad approaches a scarf-and-program vendor outside San Siro on match day, half an hour before kickoff.]'),
  sanSiroMatchLive: register(sanSiroMatchLive, 'Giuseppe', 'giuseppe_says',
    '[Chad has just sat down in the San Siro stands. Giuseppe drops into the seat next to him as the match begins.]'),
  sanSiroEntry: register(sanSiroEntry, 'Nonno Aldo', 'aldo_says',
    '[Chad arrives at the San Siro biglietteria booth, ticket in hand.]'),
  gabriellaApartment: register(gabriellaApartment, 'Gabriella', 'gabriella_says',
    "[Chad arrives at Gabriella's apartment for an afternoon visit.]")
};

// Display order on the home screen.
export const storyOrder = [
  'hotelLive', 'caffeLive', 'metroLive', 'duomoLive', 'mercatoLive',
  'trattoriaLive', 'navigliLive',
  'viaDellaSpigasLive', 'casaMilanLive',
  'bartoliniLive', 'sanSiroEntry', 'sanSiroVendorLive', 'sanSiroMatchLive',
  'gabriellaApartment'
  // NOTE: bartoliniSommelierLive intentionally NOT in storyOrder — it's
  // chain-only, reached via bartoliniLive's chainTo, not directly clickable.
];

export function getScenario(id) {
  return scenarios[id] || null;
}
