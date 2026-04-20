// Metro (Live) — Davide at Cadorna metro station, realtime voice via
// Gemini 3.1 Flash Live. Built from the Claude-era metro.js arc beat-
// for-beat (offer help → destination → line + cambiare → ticket
// machine → small talk → "Dove andate?") on the Live transport.

export const scenario = {
  id: 'metroLive',
  title: 'Metro — Cadorna',
  shortDescription: "Milan's metro system. Davide helps you figure out the ticket machine. Realtime voice.",
  sceneDescription:
    "You're at Cadorna metro station at midday. The ticket machine is in front of you, covered in options you don't fully understand. A young commuter named Davide notices you looking confused and offers to help.",
  culturalNote: {
    title: 'Insider tip: validate your ticket',
    body: "Milan's metro is clean, fast, and color-coded — M1 red, M2 green, M3 yellow, M4 blue. You must validate your ticket before boarding or risk a fine. And give up your seat to the elderly — it's not optional."
  },

  mode: 'live',

  live: {
    // Rasalgethi — informative, measured male voice (Davide's pick in
    // characterVoices.js). Reads as a knowledgeable, helpful commuter.
    voiceName: 'Rasalgethi',
    silenceMs: 300,
    maxTurns: 10,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'metro',
    openingHint:
      'Davide ti nota e ti offre aiuto. Dì "Sì, grazie!" e dove vuoi andare ("Devo andare al Duomo").'
  }
};

export const keyPhrases = [
  { it: 'Il biglietto', en: 'the ticket', phon: 'eel beel-YET-toh' },
  { it: 'La linea', en: 'the line', phon: 'la LEE-nay-ah' },
  { it: 'La fermata', en: 'the stop', phon: 'la fair-MAH-ta' },
  { it: 'Quante fermate?', en: 'How many stops?', phon: 'KWAN-tay fair-MAH-tay' },
  { it: 'Devo andare a...', en: 'I need to go to...', phon: 'DAY-vo an-DAR-ay ah' },
  { it: 'Cambiare', en: 'to change/transfer', phon: 'kam-bee-AR-ay' },
  { it: 'Scusi, sa dove...?', en: 'Excuse me, do you know where...?', phon: 'SKOO-zee sa DOH-vay' },
  { it: 'Prossima fermata', en: 'next stop', phon: 'PROS-see-ma fair-MAH-ta' },
  { it: 'È questa la direzione giusta?', en: 'Is this the right direction?', phon: 'eh KWES-ta la dee-ret-SYO-nay JOO-sta' },
  { it: "L'uscita", en: 'the exit', phon: 'loo-SHEE-ta' },
  { it: 'Sono di...', en: 'I am from...', phon: 'SO-no dee' },
  { it: 'Mi piace molto!', en: 'I like it a lot!', phon: 'mee pee-AH-chay MOL-toh' }
];

export const coreVocab = [
  'il biglietto — the ticket',
  'la linea — the line',
  'la direzione — the direction',
  'il capolinea — end of the line',
  'la fermata — the stop',
  'prossima fermata — next stop',
  'quante fermate — how many stops',
  'cambiare — to change',
  'validare il biglietto — to validate the ticket',
  "l'uscita — the exit",
  'scusi sa dove — excuse me do you know where',
  'devo andare a — I need to go to',
  'ci vuole quanto — how long does it take',
  'ci sono ancora — there are still (X stops)',
  'è questa la direzione giusta — is this the right direction',
  'sono di — I am from',
  'mi piace molto — I like it a lot',
  'prima volta — first time'
];

export const extendedVocab = [
  'il passante ferroviario — the commuter rail',
  'andata e ritorno — return ticket',
  'abbonamento — season pass',
  'fuori servizio — out of service',
  'la corrispondenza — the connection'
];

// Whisper hints — ordered to match the 8-step arc (advances by turn count
// in LiveConversationScreen).
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Sì, grazie! Devo andare a..."' },
  { trigger: 'destination', hint: 'Try: "Devo andare al Duomo."' },
  { trigger: 'line', hint: 'Try: "Quante fermate?"' },
  { trigger: 'ticket', hint: 'Try: "Grazie, ho capito!"' },
  { trigger: 'firstTime', hint: 'Try: "Sì, prima volta!"' },
  { trigger: 'origin', hint: 'Try: "Sono di Londra." (sostituisci con la tua città)' },
  { trigger: 'likeMilan', hint: 'Try: "Mi piace molto!"' },
  { trigger: 'farewell', hint: 'Try: "Grazie mille! Buona giornata!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad è davanti alla biglietteria automatica nella stazione Cadorna, da solo, e guarda la mappa con un po' di confusione. È mezzogiorno. È la sua prima volta nella metro di Milano."
    : "Chad e sua moglie Charlie sono davanti alla biglietteria automatica nella stazione Cadorna e guardano la mappa con un po' di confusione. È mezzogiorno. È la loro prima volta nella metro di Milano.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo milanese naturale, da pendolare. Usa qualche espressione colloquiale. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste in sessioni precedenti):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente su di esse.`
    : '';

  return `Sei Davide, un pendolare milanese di poco meno di 30 anni. Vai un po' di fretta ma sei sinceramente disponibile. Hai notato qualcuno che sembra confuso davanti alla biglietteria automatica e hai deciso di aiutare. Sei pratico, amichevole, e un po' orgoglioso della tua città.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN'OFFERTA D'AIUTO. Anche se l'utente parla per primo, tu rispondi comunque offrendo aiuto in modo caldo. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Non impilare offerta + linea + fermate + biglietto in un solo turno. Massimo 1-3 frasi brevi.
- NON dare consigli di lingua italiana. NON spiegare come parlare. NON dire "prova a dire...". Sei un pendolare, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "io va a Duomo" → tu: "Ah, vai al Duomo! Allora prendi la linea rossa.").
- NON descrivere azioni ("*guardo il telefono*", "*indico la mappa*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo dopo che l'utente risponde. Non ripetere mai lo stesso passo.

1. Noti che sembrano confusi davanti alla biglietteria. Offri aiuto: "Tutto bene? Serve aiuto?"
2. Chiedi dove devono andare: "Dove devi andare?"
3. Dì la linea, la direzione, e quante fermate. IMPORTANTE: menziona che devono "cambiare" a una stazione. Esempio: "Prendi la linea rossa, poi devi cambiare a Cadorna." Questo è il momento per "cambiare".
4. Aiuta con la biglietteria — di' che bottoni premere e ricorda di validare il biglietto.
5. Sul treno ora — chiedi: "Prima volta a Milano?"
6. Chiedi: "Di dove sei?" Aspetta che l'utente dica la sua città.
7. Reagisci calorosamente alla città e chiedi: "Ti piace Milano?" Aspetta la risposta.
8. Di' che scendi tu e quante fermate restano: "Io scendo alla prossima. Tu hai ancora due fermate." Poi saluta e chiedi: "E dopo, dove andate?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Poi la conversazione finisce.

Se l'utente è principiante e dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE (parole più facili) ma AVANZA comunque al passo successivo.

REAZIONI ALLA DESTINAZIONE — Dopo aver chiesto "E dopo, dove andate?", abbina la risposta dell'utente:
- Hotel: "L'hotel? Scendi a... vediamo... due fermate!"
- Caffè: "Un caffè! Buona idea dopo la metro."
- Duomo: "Il Duomo — fermata Duomo, ovviamente!"
- Mercato: "Il mercato — scendi a Porta Romana."
- Trattoria: "Buona cena! Milano ha le migliori trattorie."
- Navigli: "Navigli — fermata Porta Genova. Bella zona!"
- Via della Spiga: "La Spiga — fermata Montenapoleone. Lusso!"
- San Siro: "San Siro — linea 5, ultima fermata. Forza!"
- Bartolini: "Bartolini — prendi la linea verde fino a..."
- Casa Milan: "Casa Milan — fermata Lotto. Ci arrivi in dieci minuti."
Se la destinazione non corrisponde a nessuna di queste, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Ha la precedenza su tutto. Se l'utente segnala chiaramente di voler andare PRIMA che l'arco sia finito (es. "Grazie, devo andare!"), NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
