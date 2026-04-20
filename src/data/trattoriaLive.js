// Trattoria (Live) — Lorenzo at a classic Milanese trattoria, realtime
// voice via Gemini 3.1 Flash Live. Mirrors the Claude trattoria.js arc
// beat-for-beat: greeting + reservation → seating + menus → "Cosa
// consiglia?" + risotto/cotoletta → take order + wine → mid-meal +
// dolce → bill → "Dove andate?".

export const scenario = {
  id: 'trattoriaLive',
  title: 'Trattoria — La Cena',
  shortDescription: "A classic Milanese trattoria. Evening service. Lorenzo has opinions about the menu. Realtime voice.",
  sceneDescription:
    "You're at the entrance of a warm, bustling trattoria. Lorenzo, the waiter, stands by the reservation book. The kitchen smells of saffron and butter. It's evening — dinner service is in full swing.",
  culturalNote: {
    title: 'Insider tip: the Italian dinner',
    body: "Italians eat in courses — primi, secondi, contorni arrive separately. Service is usually included (servizio compreso). Risotto alla Milanese and cotoletta alla Milanese are the must-orders. Don't rush — dinner is an event."
  },

  mode: 'live',

  live: {
    // Gacrux — mature, unhurried male voice (Lorenzo's pick in
    // characterVoices.js). Reads as a measured professional waiter
    // who lets the food speak for itself.
    voiceName: 'Gacrux',
    silenceMs: 300,
    maxTurns: 12,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'trattoria',
    openingHint:
      'Lorenzo ti accoglie all\'entrata. Saluta e di\' che hai una prenotazione: "Buonasera! Ho una prenotazione."'
  }
};

export const keyPhrases = [
  { it: 'Ho una prenotazione', en: 'I have a reservation', phon: 'oh OO-na pray-no-ta-TSYO-nay' },
  { it: 'Il menù', en: 'The menu', phon: 'eel meh-NOO' },
  { it: 'Il primo', en: 'First course', phon: 'eel PREE-mo' },
  { it: 'Il secondo', en: 'Main course', phon: 'eel say-KON-do' },
  { it: 'Il contorno', en: 'Side dish', phon: 'eel kon-TOR-no' },
  { it: 'Il dolce', en: 'Dessert', phon: 'eel DOL-chay' },
  { it: 'Cosa consiglia?', en: 'What do you recommend?', phon: 'KO-za kon-SEEL-ya' },
  { it: 'Vorrei...', en: 'I would like...', phon: 'vor-RAY' },
  { it: 'Per me', en: 'For me', phon: 'pair MAY' },
  { it: 'Una bottiglia di...', en: 'A bottle of...', phon: 'OO-na bot-TEEL-ya dee' },
  { it: 'Il vino della casa', en: 'House wine', phon: 'eel VEE-no DEL-la KAH-za' },
  { it: 'Il conto, per favore', en: 'The bill please', phon: 'eel KON-toh pair fa-VOR-ay' },
  { it: 'Era squisito', en: 'It was exquisite', phon: 'EH-ra skwee-ZEE-toh' },
  { it: 'È compreso il servizio?', en: 'Is service included?', phon: 'eh kom-PRAY-zo eel ser-VEE-tsyo' },
  { it: 'Rosso, per favore', en: 'Red, please', phon: 'ROS-so pair fa-VOR-ay' },
  { it: 'Bianco, per favore', en: 'White, please', phon: 'BYAN-ko pair fa-VOR-ay' }
];

export const coreVocab = [
  'ho una prenotazione — I have a reservation',
  'il menù — the menu',
  'il primo — first course',
  'il secondo — main course',
  'il contorno — side dish',
  'il dolce — dessert',
  'il digestivo — after-dinner drink',
  'cosa consiglia — what do you recommend',
  'vorrei — I would like',
  'per me — for me',
  'per noi — for us',
  'una bottiglia di — a bottle of',
  'il vino della casa — house wine',
  'rosso — red',
  'bianco — white',
  'senza — without',
  "sono allergico a — I'm allergic to",
  'è tutto bene — is everything good',
  'era squisito — it was exquisite',
  'il conto per favore — the bill please',
  'è compreso il servizio — is service included',
  'possiamo pagare separati — can we pay separately'
];

export const extendedVocab = [
  'al dente — pasta texture',
  'il ragù — meat sauce',
  'la cotoletta alla Milanese — breaded veal cutlet',
  'il risotto allo zafferano — saffron risotto',
  'il brasato — braised beef',
  'la tagliata — sliced steak',
  'fritto/grigliato/al forno — fried/grilled/baked',
  'medio/ben cotto — medium/well done',
  'al sangue — rare'
];

// Whisper hints — ordered to match the 8-step arc.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buonasera! Ho una prenotazione."' },
  { trigger: 'menu', hint: 'Try: "Grazie."' },
  { trigger: 'recommend', hint: 'Try: "Cosa consiglia?"' },
  { trigger: 'order', hint: 'Try: "Vorrei il risotto, per me la cotoletta."' },
  { trigger: 'wine', hint: 'Try: "Rosso, per favore." o "Una bottiglia di vino della casa."' },
  { trigger: 'midmeal', hint: 'Try: "Era squisito!"' },
  { trigger: 'dolce', hint: 'Try: "Sì, grazie!" o "No, il conto per favore."' },
  { trigger: 'bill', hint: 'Try: "Il conto, per favore. È compreso il servizio?"' },
  { trigger: 'farewell', hint: 'Try: "Grazie, buona serata!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad è appena arrivato alla trattoria, da solo, per una cena prenotata. È la sua prima volta a Milano. È sera."
    : "Chad e sua moglie Charlie sono appena arrivati alla trattoria per una cena prenotata. È la loro prima volta a Milano. È sera.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo milanese naturale. Usa qualche idioma e sfumatura regionale. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente e professionale. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei Lorenzo, un cameriere in una classica trattoria milanese. Hai 40 anni circa: professionale, silenziosamente orgoglioso della cucina, e hai opinioni precise sul menù. Sei caldo ma misurato — lasci parlare il cibo, e ti illumini quando gli ospiti chiedono il tuo consiglio.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO. Anche se l'utente parla per primo, tu rispondi comunque con un saluto caldo e professionale. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi. Lorenzo è professionale e misurato.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei un cameriere, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "voglio il primo" → tu: "Ah, vorrebbe il primo! Ottima scelta.").
- NON descrivere azioni ("*porto il menù*", "*annuisco*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo.

1. Saluto: "Buonasera!" Accogli con calore, chiedi se hanno una prenotazione.
2. Falli accomodare, presenta i menù — guidali al tavolo, consegna il menù. Descrivi le specialità brevemente nello stesso turno.
3. Chiedono cosa consigli — consiglia il risotto alla Milanese con vera passione. Menziona anche la cotoletta e il contorno.
4. Prendi l'ordine — primo, secondo. Poi chiedi il vino: "Rosso o bianco?" Aspetta la risposta.
5. Conferma il vino e porta il cibo. Controllo a metà pasto: "È tutto bene?"
6. Offri il dolce — descrivi una opzione brevemente. Accettano o rifiutano.
7. Chiedono il conto — "Il conto, per favore." Scambio breve: "Era squisito!" / "È compreso il servizio?" Gestisci entrambi in questo turno.
8. Saluto: "Buona serata!" Poi chiedi: "Dove andate adesso?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Poi la conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

REAZIONI ALLA DESTINAZIONE — Dopo "Dove andate adesso?", abbina la risposta:
- Hotel: "Buona notte! Dopo una cena così, dormirete bene."
- Caffè: "Un caffè dopo cena — come un vero italiano!"
- Duomo: "Il Duomo di notte è magico — le luci sulla facciata..."
- Metro: "La metro chiude a mezzanotte — fate attenzione!"
- Mercato: "Il mercato domani mattina? Perfetto dopo una buona cena."
- Navigli: "I Navigli dopo cena — un digestivo sul canale!"
- Via della Spiga: "La Spiga di sera è vuota — perfetta per passeggiare."
- San Siro: "San Siro di sera — che atmosfera!"
- Bartolini: "Bartolini dopo di noi? Ambizioso!"
- Casa Milan: "Casa Milan — un pellegrinaggio calcistico!"
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
