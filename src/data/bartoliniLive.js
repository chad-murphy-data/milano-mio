// Bartolini Phase A (Live) — Alessandro the maitre d' welcomes you and
// gets you through the first courses, then hands off to Elena the
// sommelier for the wine pairing + dessert via the chainTo mechanism.
// Realtime voice via Gemini 3.1 Flash Live.
//
// This is the first scenario in the app to use multi-phase chaining
// — the original Claude bartolini.js had Alessandro and Elena in the
// same prompt, which Live couldn't voice distinctly (single voice
// per session). Splitting the evening across two sessions lets each
// character sound like themselves.
//
// Vocab + cultural note cover the WHOLE evening (both phases) — the
// briefing screen only fires for this Phase A, not for Elena's
// chained phase.

export const scenario = {
  id: 'bartoliniLive',
  title: 'Bartolini — Tre Stelle',
  shortDescription: "Enrico Bartolini al MUDEC. Three Michelin stars. The tasting menu experience. Realtime voice.",
  sceneDescription:
    "You're at the entrance of Enrico Bartolini al MUDEC, Milan's three-Michelin-star restaurant inside the Museum of Cultures. Alessandro, the maitre d', stands at the podium. The dining room glows with understated elegance. This is a three-hour tasting menu evening — Alessandro will see you through the first courses, then Elena (the sommelier) takes over for wines and dessert.",
  culturalNote: {
    title: 'Insider tip: three Michelin stars',
    body: "Three Michelin stars means 'worth a special journey.' You book months in advance. The tasting menu is 3+ hours of seasonal courses with wine pairings. MUDEC is the Museum of Cultures. This is the most formal Italian you'll encounter in Milan — expect the Lei form throughout."
  },

  mode: 'live',

  live: {
    // Iapetus — clear, refined male voice (Alessandro's pick in
    // characterVoices.js). Reads as the precise, measured maitre d' the
    // role demands.
    voiceName: 'Iapetus',
    silenceMs: 300,
    // Playtest rework (see scripts/playtest-findings/bartoliniLive.md):
    // beat 4 split into dish + insider gives 7 beats; one extra turn of
    // slack for offbeat players who ask their own questions.
    maxTurns: 8,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'bartolini',
    openingHint:
      'Alessandro ti accoglie al podio. Saluta con cortesia: "Buonasera, ho una prenotazione."',
    // Chain to Elena's phase — when this Live session ends, App routes
    // through IntermezzoScreen instead of going straight to debrief.
    chainTo: 'bartoliniSommelierLive',
    intermezzoText:
      "Alessandro si congeda con un inchino discreto. Elena, la sommelier, si avvicina al tavolo con il primo vino della serata."
  }
};

export const keyPhrases = [
  { it: 'Ho una prenotazione', en: 'I have a reservation', phon: 'oh OO-na pray-no-ta-TSYO-nay' },
  { it: 'Il menu degustazione', en: 'The tasting menu', phon: 'eel meh-NOO day-goo-sta-TSYO-nay' },
  { it: "L'abbinamento vini", en: 'The wine pairing', phon: 'lab-bee-na-MEN-toh VEE-nee' },
  { it: 'Stagionale', en: 'Seasonal', phon: 'sta-jo-NAH-lay' },
  { it: 'Il sapore', en: 'The flavor', phon: 'eel sa-POR-ay' },
  { it: 'Complimenti allo chef', en: 'Compliments to the chef', phon: 'kom-plee-MEN-tee AL-lo shef' },
  { it: 'È straordinario', en: "It's extraordinary", phon: 'eh stra-or-dee-NAR-yo' },
  { it: 'Potrei sapere...?', en: 'Could I ask...?', phon: 'po-TRAY sa-PAIR-ay' },
  { it: 'Di che regione?', en: 'From which region?', phon: 'dee kay ray-JO-nay' },
  { it: 'Secco o dolce?', en: 'Dry or sweet?', phon: 'SEK-ko oh DOL-chay' },
  { it: 'Corposo', en: 'Full-bodied', phon: 'kor-PO-zo' },
  { it: 'Leggero', en: 'Light', phon: 'lej-JAY-ro' },
  { it: "L'annata", en: 'The vintage', phon: 'lan-NAH-ta' }
];

export const coreVocab = [
  'ho una prenotazione — I have a reservation',
  'il menu degustazione — the tasting menu',
  'il piatto — the dish/course',
  "l'abbinamento vini — the wine pairing",
  'stagionale — seasonal',
  'il territorio — the terroir/region',
  'il sapore — the flavor',
  'la consistenza — the texture',
  "è straordinario — it's extraordinary",
  'complimenti allo chef — compliments to the chef',
  'potrei sapere — could I know/may I ask',
  'di che regione — from which region',
  "l'annata — the vintage",
  'secco — dry',
  'dolce — sweet',
  'corposo — full-bodied',
  'leggero — light'
];

export const extendedVocab = [
  'la tecnica — the technique',
  'la riduzione — the reduction',
  'il fondo — the jus/stock',
  'crudo — raw',
  'cotto — cooked',
  'il sorbetto — sorbet',
  'abbinare — to pair',
  'esaltare i sapori — to enhance the flavors'
];

// Whisper hints — Phase A only (greeting through first courses). Elena's
// scenario carries her own hints for Phase B.
// Playtest rework (see scripts/playtest-findings/bartoliniLive.md): updated
// from 6 positional hints to 7 — arc stays 6 beats but the dish/insider
// split means two guest-facing turns happen in beats 4-5, so an extra hint
// slot gives offbeat players (maxTurns 8) cover for that extra exchange.
// The insider hint now fires AFTER the dish reaction, not before.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buonasera, ho una prenotazione."' },
  { trigger: 'name', hint: 'Try: "Sono [il suo nome]."' },
  { trigger: 'menu', hint: 'Try: "Il menu degustazione, per favore."' },
  { trigger: 'dish', hint: 'Try: "È straordinario!" o "Complimenti allo chef."' },
  { trigger: 'insider', hint: 'Try: "Davvero?" o "Che bello!"' },
  { trigger: 'reaction', hint: 'Try: "Che interessante!" o "Non lo sapevo."' },
  { trigger: 'handoff', hint: 'Try: "Grazie, Alessandro. Buona serata."' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  // Playtest fix (see scripts/playtest-findings/bartoliniLive.md): facile
  // guestSetup said "da solo" but the arc used plural "li accomodi" — fixed
  // to singular throughout for facile, plural for normale/difficile.
  const guestSetup = isFacile
    ? "Chad è appena arrivato a Enrico Bartolini al MUDEC, da solo, per la sua prenotazione del menu degustazione. È la sua prima volta in un ristorante a tre stelle Michelin. Riferisciti a lui al singolare: 'La accompagno', 'Le presento', 'Desidera'."
    : "Chad e sua moglie Charlie sono appena arrivati a Enrico Bartolini al MUDEC per la loro prenotazione del menu degustazione. È la loro prima volta in un ristorante a tre stelle Michelin.";

  const paceLine = isFacile
    ? "Parla lentamente con registro elevato. NOTA: anche in Easy, il registro resta formale ed elegante — la difficoltà qui è il registro, non la velocità."
    : isDifficile
    ? "Parla a ritmo naturale con registro pienamente formale. Usa lessico culinario raffinato e frasi eleganti. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente con registro formale. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  // Playtest fix (see scripts/playtest-findings/bartoliniLive.md): the
  // SCENARIO context line had "li accogli, li accomodi" hardcoded outside
  // guestSetup, so facile (solo) guests still got plural pronouns there.
  const scenarioContext = isFacile
    ? "Questa è la PRIMA METÀ della serata: La accogli, La accomodi, presenti il menu degustazione, presenti i primi piatti."
    : "Questa è la PRIMA METÀ della serata: li accogli, li accomodi, presenti il menu degustazione, presenti i primi piatti.";

  return `Sei Alessandro, il maître di Enrico Bartolini al MUDEC, un ristorante tre stelle Michelin a Milano. Hai 50 anni circa, sei la persona più professionale di qualsiasi stanza, vestito impeccabilmente, con calore sotto la formalità. Parli con precisione ed eleganza. USA SEMPRE IL "LEI" — mai "tu" — è un tre stelle Michelin.

SCENARIO: ${guestSetup} ${scenarioContext} Poi consegni il tavolo a Elena, la sommelier, che presenterà i vini e si occuperà del resto della serata.

INIZIA SEMPRE TU CON UN SALUTO ELEGANTE. Anche se l'utente parla per primo, tu rispondi comunque con un saluto formale e caloroso. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- USA SEMPRE IL "LEI" — mai "tu", mai "voi" come informale. Forme verbali alla terza persona singolare. Esempi: "Desidera...", "La accompagno...", "Le presento...".
- Una sola cosa per turno. MASSIMO 1-2 frasi BREVI per turno. Eleganza significa economia di parole, non lunghezza. Descrivi ogni piatto in UNA frase, mai di più.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei un maître, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente con grazia (utente: "voglio sapere il vino" → tu: "Desidera sapere del vino! Certamente.").
- NON descrivere azioni ("*si inchina*", "*indica il tavolo*"). Solo parole parlate.
- NON inventare ospiti che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

L'ARCO — sei momenti da raggiungere, più o meno in quest'ordine, ma L'OSPITE VIENE PRIMA DEL COPIONE. Segui ciò che dice davvero: se fa una domanda, rispondile con grazia prima di andare avanti; se risponde in modo diverso dall'atteso, assecondalo.

1. Saluto al podio con calore misurato: "Buonasera. Benvenuto a Enrico Bartolini." Chiedi il nome con cortesia.
2. Conferma la prenotazione e accompagna al tavolo in una frase elegante: "Mi segua, prego. Il Suo tavolo è pronto."
3. Presenta il menu degustazione. Una frase sulla filosofia dello chef: "Lo chef propone un menu stagionale, di territorio. Otto portate." Lascia che l'ospite reagisca.
4. Il primo piatto arriva. Descrivilo in UNA frase sola (improvvisa qualcosa di stagionale e milanese, tipo "Risotto allo zafferano con midollo di bue"). Poi chiedi con semplicità: "Le piace?" — e FERMATI qui. Se l'ospite fa una domanda sul piatto (ingredienti, tecnica, provenienza), rispondile con una frase prima di chiedere.
5. Dopo che l'ospite ha reagito al piatto, offri — come una confidenza sottovoce — UN solo dettaglio vero sullo chef o sulla cucina. Per esempio: che Bartolini è stato il primo cuoco italiano a ricevere tre stelle in due ristoranti contemporaneamente; oppure che il risotto è fatto senza burro in mantecatura — solo brodo del territorio. È un regalo, non una lezione: dillo con discrezione e lascia che l'ospite assorba. Se risponde con curiosità, una frase di risposta, poi guida naturalmente verso il congedo.
6. Congedo e passaggio a Elena in un unico gesto elegante: "Mi permetta di lasciarLa alle cure di Elena, la nostra sommelier. Si occuperà degli abbinamenti e del seguito della serata. Le auguro una serata indimenticabile." La conversazione di Phase A finisce qui — Elena prenderà il sopravvento dopo l'intermezzo.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma sempre formale, poi procedi con grazia.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase elegante di saluto e chiudi.${retrySection}`;
}
