// Scenario registry — single lookup point for all story mode scenarios.
// Screens receive a scenario object as a prop; they never import data files directly.

import * as caffe from './caffe.js';
import * as hotel from './hotel.js';
import * as duomo from './duomo.js';
import * as metro from './metro.js';
import * as mercato from './mercato.js';
import * as trattoria from './trattoria.js';
import * as navigli from './navigli.js';
import * as viaDellaSpigas from './viaDellaSpigas.js';
import * as bartolini from './bartolini.js';
import * as casaMilan from './casaMilan.js';
import * as sanSiro from './sanSiro.js';
import * as sanSiroEntry from './sanSiroEntry.js';

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
  hotel: register(hotel, 'Giulia', 'giulia_says',
    '[Chad arrives at the hotel reception desk with luggage.]'),
  caffe: register(caffe, 'Marco', 'marco_says',
    '[Chad walks up to the bar.]'),
  metro: register(metro, 'Davide', 'davide_says',
    '[Chad is standing at a ticket machine in Cadorna metro station, looking at the map.]'),
  duomo: register(duomo, 'Francesca', 'francesca_says',
    '[Chad approaches the tourist information point in Piazza del Duomo.]'),
  mercato: register(mercato, 'Rosa', 'rosa_says',
    '[Chad approaches a market stall piled high with fresh produce, cheese, and cured meats.]'),
  trattoria: register(trattoria, 'Lorenzo', 'lorenzo_says',
    '[Chad arrives at the trattoria entrance for their dinner reservation.]'),
  navigli: register(navigli, 'Sofia', 'sofia_says',
    '[Chad sits down at a canal-side table at a bar in the Navigli district, early evening.]'),
  viaDellaSpigas: register(viaDellaSpigas, 'Valentina', 'valentina_says',
    '[Chad enters an elegant boutique on Via della Spiga.]'),
  casaMilan: register(casaMilan, 'Paolo', 'paolo_says',
    '[Chad enters the Casa Milan museum and merch shop.]'),
  bartolini: register(bartolini, 'Alessandro', 'alessandro_says',
    '[Chad arrives at the entrance of Enrico Bartolini al MUDEC for their tasting menu reservation.]'),
  sanSiro: register(sanSiro, 'Vendor / Giuseppe', 'giuseppe_says',
    '[Chad arrives outside San Siro stadium on match day. The crowd is buzzing.]'),
  sanSiroEntry: register(sanSiroEntry, 'Nonno Aldo', 'aldo_says',
    '[Chad arrives at the San Siro biglietteria booth, ticket in hand.]')
};

// Display order on the home screen.
export const storyOrder = [
  'hotel', 'caffe', 'metro', 'duomo', 'mercato',
  'trattoria', 'navigli', 'viaDellaSpigas', 'casaMilan',
  'bartolini', 'sanSiroEntry', 'sanSiro'
];

export function getScenario(id) {
  return scenarios[id] || null;
}
