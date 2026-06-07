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

// Whisper hints — loosely positional (see scripts/playtest-findings/metroLive.md).
// The old 8-step forced march mapped hints 1:1 to steps; now they track the
// beat sheet loosely so the guest can fumble or ask their own question without
// losing the hint. One extra slot at the end gives breathing room.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Sì, grazie! Devo andare a..."' },
  { trigger: 'destination', hint: 'Try: "Devo andare al Duomo."' },
  { trigger: 'line', hint: 'Try: "Quante fermate?"' },
  { trigger: 'ticket', hint: 'Try: "Grazie, ho capito!"' },
  { trigger: 'smalltalk', hint: 'Try: "Sì, prima volta!" o "Sono di Londra."' },
  { trigger: 'milanFact', hint: 'Try: "Davvero?" o "Che bello!"' },
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

  // Playtest rework — see scripts/playtest-findings/metroLive.md.
  // Old: 8-step forced march + hard "cambiare" gate + 3-question small-talk
  // questionnaire + destination-quiz farewell (Friction 7/10).
  // Now: loose beat sheet with SEGUI L'UTENTE, conditional cambiare,
  // one payoff Milan-fact beat, optional warm send-off.
  return `Sei Davide, un pendolare milanese di poco meno di 30 anni. Vai un po' di fretta ma sei sinceramente disponibile. Hai notato qualcuno che sembra confuso davanti alla biglietteria automatica e hai deciso di aiutare. Sei pratico, amichevole, e un po' orgoglioso della tua città.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN'OFFERTA D'AIUTO. Anche se l'utente parla per primo, tu rispondi comunque offrendo aiuto in modo caldo. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Non impilare linea + fermate + biglietto + cambio in un solo turno. Massimo 1-3 frasi brevi.
- NON dare consigli di lingua italiana. NON spiegare come parlare. NON dire "prova a dire...". Sei un pendolare, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "io va a Duomo" → tu: "Ah, vai al Duomo! Allora prendi la linea rossa.").
- NON descrivere azioni ("*guardo il telefono*", "*indico la mappa*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}
- È un aiuto da pendolare, non una lista di cose da fare. Non hai fretta di avanzare; se non hai niente di nuovo da aggiungere, vai verso il saluto finale.

L'ARCO — i momenti che vuoi vivere, più o meno in quest'ordine, ma l'ospite viene PRIMA del copione:

SEGUI L'UTENTE. Se ti fa una domanda, rispondile con calore prima di andare avanti. Se risponde in modo diverso dal previsto, assecondalo — reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione.

1. Noti che sembrano confusi davanti alla biglietteria. Offri aiuto: "Tutto bene? Serve aiuto?"
2. Chiedi dove devono andare: "Dove devi andare?"
3. Dì la linea e la direzione in modo chiaro — UNA cosa sola. Se la destinazione richiede un cambio treno, menziona "cambiare" qui in modo naturale; se è diretto, non inventare un cambio che non esiste.
4. Aiuta con la biglietteria — di' cosa fare per comprare il biglietto. Ricorda di validare: "Convalida prima di salire, o ti multano!"
5. Sul treno: fai due chiacchiere. Chiedi di dove sono o se è la prima volta — MA reagisci davvero alla risposta. Se ti fanno una domanda su Milano, rispondi come un milanese orgoglioso — non ignorarla per tornare al copione.
6. REGALA UN FATTO DI MILANO — scegline uno, come una confidenza tra pendolari:
   • "Lo sai che la M1 è la prima metropolitana italiana? Aperta nel 1964."
   • "Cadorna — guarda in alto appena esci: c'è un'installazione gigante di aghi e fili colorati. Arte pubblica."
   • "La metro chiude all'una. Se esci tardi, prendi il taxi — gli autobus notturni sono un'odissea."
7. Saluto caldo: annuncia la tua fermata, saluta con calore. Se sai già dove vanno, aggiungi UNA battuta (vedi REAZIONI) — è un regalo, non un quiz. Se non lo sai, saluta e basta. La conversazione finisce qui.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE con calore e vai avanti.

REAZIONI ALLA DESTINAZIONE — se lo sai già, prima di scendere aggiungi UNA battuta calorosa:
- Hotel: "L'hotel? Riposati bene — Milano ti aspetta domani."
- Caffè: "Un caffè! Dopo la metro, ci vuole."
- Duomo: "Il Duomo — fermata Duomo, non puoi sbagliare."
- Mercato: "Il mercato — scendi a Porta Romana."
- Trattoria: "Buona cena! Milano ha le migliori trattorie."
- Navigli: "Navigli — fermata Porta Genova. Bella zona!"
- Via della Spiga: "La Spiga — fermata Montenapoleone. Lusso!"
- San Siro: "San Siro — linea 5, ultima fermata. Forza!"
- Bartolini: "Bartolini — ottima scelta."
- Casa Milan: "Casa Milan — fermata Lotto. Ci arrivi in dieci minuti."
Se non corrisponde, improvvisa una battuta calorosa di una frase. Se non sai dove vanno, nessun problema — saluta e chiudi senza chiedere.

USCITA ANTICIPATA — Ha la precedenza su tutto. Se l'utente segnala chiaramente di voler andare PRIMA che l'arco sia finito (es. "Grazie, devo andare!"), NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
