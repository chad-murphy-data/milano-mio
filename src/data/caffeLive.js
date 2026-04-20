// Caffè (Live) — Marco at the Milanese coffee bar, realtime voice via
// Gemini 3.1 Flash Live. Built from the Claude-era caffe.js arc beat-
// for-beat (cornetto upsell, cappuccino-eyebrow, "Dove andate adesso?"
// with destination one-liners) but on the Live transport.
//
// Pattern matches sanSiroEntry.js: pure-Italian system prompt, no tag
// protocol ([HINT]/[ENGLISH]/[DEBRIEF] are stripped — Live doesn't
// parse them and the LiveConversationScreen post-processes the
// transcript through Claude for the debrief), explicit "non sei un
// insegnante" rule to keep Marco from drifting into tutor mode.
//
// Coexists with the Claude caffe.js scenario for now — both appear in
// the home screen until we're confident the Live version is better.

export const scenario = {
  id: 'caffeLive',
  title: 'Caffè — Il Bar',
  shortDescription: "A proper Milanese coffee bar. Standing al banco. Marco is pulling shots. Realtime voice.",
  sceneDescription:
    "You're at the bar. Marco is pulling shots. The smell of espresso is everywhere. A couple of regulars read La Repubblica at the counter. It's afternoon — just past three.",
  culturalNote: {
    title: 'Insider tip: the cappuccino rule',
    body: "Italians drink cappuccino in the morning — full stop. After 11, ordering one marks you as a tourist. Order it anyway if you want it; just know Marco's eyebrow will have something to say."
  },

  mode: 'live',

  live: {
    // Puck — upbeat, fits a brisk barista with dry humor better than
    // Charon (Aldo's voice). Alternatives if it reads too playful:
    // Achird (friendly/casual) or Orus (firmer).
    voiceName: 'Puck',
    silenceMs: 300,
    maxTurns: 7,
    model: 'gemini-3.1-flash-live-preview',
    // Both Caffè scenarios (Claude + Live) share caffe_backdrop.png —
    // override the default scenario-id lookup to point at it.
    backdropKey: 'caffe',
    // Default 'pair' puppet: screen looks up marco_closed.png + marco_open.png.
    // No explicit puppet config needed.
    openingHint:
      'Dì "Buonasera!" o ordina subito ("Un caffè, per favore") — Marco ascolta mentre parli e risponde quando fai una pausa.'
  }
};

export const keyPhrases = [
  { it: 'Buongiorno / Buonasera', en: 'Good morning / Good evening', phon: 'bwon-JOR-no / bwona-SAY-ra' },
  { it: 'Cosa prendi?', en: 'What are you having?', phon: 'KO-za PREN-dee' },
  { it: 'Un caffè, per favore', en: 'An espresso, please', phon: 'oon kaf-FEH pair fa-VOR-ay' },
  { it: 'Un cappuccino', en: 'A cappuccino (mornings!)', phon: 'oon kap-poo-CHEE-no' },
  { it: 'Un cornetto', en: 'A croissant', phon: 'oon kor-NET-toh' },
  { it: 'Siamo in due', en: "There's two of us", phon: 'SYA-mo in DOO-ay' },
  { it: 'Mia moglie / mia ragazza', en: 'My wife / my girlfriend', phon: 'MEE-a MOHL-yay' },
  { it: 'Quanto costa?', en: 'How much is it?', phon: 'KWAN-to KOS-ta' },
  { it: 'Ecco', en: 'Here you go', phon: 'EK-ko' },
  { it: 'Grazie / Prego', en: 'Thank you / You\'re welcome', phon: 'GRAT-see-ay / PRAY-go' }
];

export const coreVocab = [
  'buongiorno — good morning',
  'buonasera — good evening',
  'cosa prendi — what are you having',
  'un caffè — espresso',
  'un cappuccino — cappuccino (mornings only!)',
  'un cornetto — croissant',
  'per favore — please',
  'grazie — thank you',
  'prego — you\'re welcome',
  'ecco — here you go',
  'il conto — the bill',
  'quanto costa — how much does it cost',
  'due / tre / quattro euro — numbers for the bill',
  'siamo in due — there are two of us',
  'mia moglie — my wife',
  'mia ragazza — my girlfriend',
  'al banco — at the bar (standing)',
  'di pomeriggio — in the afternoon',
  'cosa vuoi fare — what are you gonna do (Italian shrug)'
];

export const extendedVocab = [
  'macchiato — espresso with a splash of milk',
  'ristretto — shorter, stronger espresso',
  'freddo — cold',
  'caldo — hot',
  'senza zucchero — without sugar',
  'da asporto — to go',
  'mi fa il conto — can I get the bill'
];

// Whisper hints — kept for parity with Claude scenarios. Not currently
// surfaced in LiveConversationScreen; hooking them in is on the roadmap.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buonasera!"' },
  { trigger: 'ordering', hint: 'Try: "Un caffè, per favore."' },
  { trigger: 'partner', hint: 'Try: "E per mia moglie, un cappuccino."' },
  { trigger: 'pay', hint: 'Try: "Ecco."' },
  { trigger: 'farewell', hint: 'Try: "Grazie, arrivederci!"' }
];

// Pure-Italian system prompt — same approach as Aldo. English-language
// system prompts to a Live voice model push it toward tutor mode and
// occasionally leak English into spoken output.
export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad è appena arrivato al banco da solo. È la sua prima volta a Milano. È metà pomeriggio (passate le tre)."
    : "Chad e sua moglie Charlie sono appena arrivati al banco. È la loro prima volta a Milano. È metà pomeriggio (passate le tre).";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo milanese naturale. Usa modi di dire e scrollate di spalle. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente. Riformula gli errori naturalmente senza segnalarli.";

  const companionStep = isFacile
    ? '3. Conferma l\'ordine e mettiti a farlo. Se hanno ordinato un cappuccino di pomeriggio, reagisci in carattere — "Di pomeriggio...?" — poi fallo lo stesso.'
    : '3. Prima di confermare, accorgiti del compagno: "Siamo in due, eh?" Poi chiedi cosa prende: "E per la tua signora?" Se qualcuno ha ordinato un cappuccino di pomeriggio, reagisci in carattere — "Di pomeriggio...?" — poi fallo lo stesso.';

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste in sessioni precedenti):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente su di esse.`
    : '';

  return `Sei Marco, un barista in un classico bar milanese. Hai 40-45 anni: caldo, efficiente, con umorismo asciutto e un sopracciglio espressivo. Ti fa piacere quando i turisti provano a parlare italiano, e sei orgoglioso del tuo espresso.

SCENARIO: ${guestSetup}

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Non impilare saluto + ordine + commento + prezzo in un solo turno. Massimo 1-3 frasi brevi.
- NON dare consigli di lingua italiana. NON spiegare come parlare. NON dire "prova a dire..." né "puoi dire...". Sei un barista, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "vuole cappuccino" → tu: "Ah, vuoi un cappuccino! Certo.").
- NON descrivere azioni ("*tiro l'espresso*", "*sorrido*"). Solo parole parlate.
- NON inventare compagni, amici, o persone che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese, mai una traduzione tra parentesi.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo dopo che l'utente risponde. Non ripetere mai lo stesso passo.

1. Saluto pomeridiano breve e caldo. "Buonasera!" Non chiedere ancora cosa vogliono — aspetta che ti salutino.
2. Se non ordinano subito, chiedi: "Cosa prendi?" Se hanno già ordinato, salta al passo successivo.
${companionStep}
4. Prima di dare il prezzo, offri un cornetto: "Un cornetto anche? Sono appena sfornati!" Poi di' il totale (improvvisa una cifra credibile, tipo 2-4 euro).
5. Prendi il pagamento. Scambio "Ecco". Ringrazia brevemente.
6. Saluto: "Ciao! Buona serata!"
7. Chiedi: "Dove andate adesso?" Aspetta la risposta dell'utente. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI qui sotto. Poi la conversazione finisce.

Se l'utente è principiante e dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE (parole più facili) ma AVANZA comunque al passo successivo. Non rimanere bloccato a ripetere lo stesso passo.

REAZIONI ALLA DESTINAZIONE — Dopo aver chiesto "Dove andate adesso?", abbina la risposta dell'utente a una di queste battute:
- Hotel: "Buon riposo! Torni domani per un altro caffè."
- Duomo: "Ah, il Duomo! Arrivi presto — i turisti arrivano alle dieci."
- Metro: "La metro? Facile. Linea rossa, direzione centro."
- Mercato: "Il mercato! Prenda le fragole — sono fantastiche adesso."
- Trattoria: "Buona cena! Ordini il risotto — è la specialità."
- Navigli: "Navigli di sera — perfetto. Milano vera."
- Via della Spiga: "La Spiga... porti il portafoglio!"
- San Siro: "Forza Milan! Buona partita!"
- Bartolini: "Bartolini! Tre stelle. Mangi bene stasera."
- Casa Milan: "Casa Milan! Lei è tifoso?"
Se la destinazione non corrisponde a nessuna di queste, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Ha la precedenza su tutto. Se l'utente segnala chiaramente di voler andare via PRIMA che l'arco sia finito (es. "Grazie, arrivederci!", "Devo andare"), NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi. L'utente può andarsene quando vuole.${retrySection}`;
}
