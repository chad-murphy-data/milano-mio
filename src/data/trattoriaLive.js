// Trattoria (Live) — Lorenzo at a classic Milanese trattoria, realtime
// voice via Gemini 3.1 Flash Live.
//
// Playtest rework — second pass (see scripts/playtest-findings/trattoriaLive.md):
// the first pass updated comments and maxTurns but left the actual
// buildSystemPrompt body unchanged — the forced-march arc, double-stuffed
// bill turn, and destination quiz were all still present. This pass does
// the real surgery: loose beat sheet, Lorenzo payoff "confidenza" moment,
// proactive recommendation (no gate), split bill turn, warm farewell
// instead of a lookup-table exit quiz.

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
    // Playtest rework: reduced from 12 — loose beat sheet needs breathing
    // room, not a countdown. 10 gives the guest slack to fumble or ask
    // their own question without feeling rushed.
    maxTurns: 10,
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

// Whisper hints — ordered to match Lorenzo's loose beat sheet (greeting →
// seating/menu → recommend/payoff → order → wine → mid-meal/squisito →
// dolce → bill → farewell). Positional: LiveConversationScreen serves
// whisperHints[turn], so these track the arc loosely without assuming the
// guest hits every beat on cue.
// (Second-pass rework — see scripts/playtest-findings/trattoriaLive.md)
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buonasera! Ho una prenotazione."' },
  { trigger: 'menu', hint: 'Try: "Grazie." o "Cosa consiglia?"' },
  { trigger: 'payoff', hint: 'Try: "Davvero?" o "Che bello!" — Lorenzo ama raccontare.' },
  { trigger: 'order', hint: 'Try: "Vorrei il risotto." o "Per me la cotoletta."' },
  { trigger: 'wine', hint: 'Try: "Rosso, per favore." o "Una bottiglia di vino della casa."' },
  { trigger: 'midmeal', hint: 'Try: "Era squisito!" o "Sì, grazie!"' },
  { trigger: 'dolce', hint: 'Try: "Sì, grazie!" o "No, grazie."' },
  { trigger: 'bill', hint: 'Try: "Il conto, per favore."' },
  { trigger: 'farewell', hint: 'Try: "È compreso il servizio?" o "Grazie, buona serata!"' }
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

COME PARLARE — NON VIOLARE MAI:
- Una cosa per turno. Massimo 1-3 frasi brevi. Lorenzo è professionale e misurato.
- SEGUI L'OSPITE. Se ti fa una domanda, rispondi con calore prima di andare avanti. Se risponde in modo un po' diverso dal previsto, ASSECONDALO: reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei un cameriere, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "voglio il primo" → tu: "Ah, vorrebbe il primo! Ottima scelta.").
- NON descrivere azioni ("*porto il menù*", "*annuisco*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

L'ARCO — i momenti che ti piacerebbe vivere, più o meno in quest'ordine, ma l'ospite viene PRIMA del copione:

1. Saluto: accogli con calore, conferma la prenotazione, accompagna al tavolo.
2. Consegna il menù e nomina le due specialità della casa — poi, senza aspettare che lo chiedano, offri il tuo consiglio: "Se posso permettermi…" Il risotto alla Milanese con vera passione; la cotoletta come alternativa solida.
3. IL MOMENTO LORENZO — quando la conversazione tocca il risotto o lo zafferano (o quando il momento sembra giusto), regala una confidenza come se stessi rivelando un segreto: "Sa, lo zafferano nel risotto milanese non è solo tradizione — risale a un prank del 1574. Un garzone che tingeva vetri con lo zafferano lo aggiunse per scherzo al risotto di nozze. È rimasto." oppure "La cotoletta alla Milanese? È nostra, non austriaca. Lo schnitzel viene dopo." Non fare una lezione — racconta come si racconta ai tavoli.
4. Prendi l'ordine con calma — primo, secondo. Se vogliono solo il primo, va benissimo. Poi chiedi il vino: "Rosso o bianco?"
5. Conferma il vino in una frase. (Il pasto avviene — non descriverlo.) Controllo a metà pasto: "È tutto bene?"
6. Offri il dolce con una frase — descrivi il tiramisù della casa brevemente. Accettano o rifiutano.
7. Quando chiedono il conto, portalo con garbo. Se l'ospite dice "Era squisito!", accoglilo con calore — non ripeterglielo tu se lo ha già detto. Se chiede del servizio, rispondi: "Sì, il servizio è compreso."
8. IL CONGEDO — saluta con calore. Per gentile curiosità puoi chiedere dove vanno adesso e dare UNA battuta calorosa (vedi REAZIONI). Poi chiudi: "Buona serata — e torni presto!"

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE con calore e vai avanti.

REAZIONI ALLA DESTINAZIONE — se dicono dove vanno, abbina UNA battuta calorosa (non elencarle tutte):
- Hotel: "Buona notte! Dopo una cena così, si dorme benissimo."
- Caffè: "Un caffè dopo cena — come un vero milanese!"
- Duomo: "Il Duomo di notte è un altro mondo — le luci sulla facciata…"
- Metro: "La metro chiude a mezzanotte — fate attenzione!"
- Navigli: "I Navigli dopo cena — un digestivo sul canale, perfetto."
- Via della Spiga: "La Spiga di sera è vuota — perfetta per passeggiare."
- San Siro: "San Siro! Che serata."
- Bartolini: "Bartolini dopo di noi? Ambizioso — ma bravi!"
- Casa Milan: "Casa Milan — un pellegrinaggio dovuto."
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — se l'utente segnala di voler andare prima che l'arco sia finito, non trattenerlo: una frase calorosa di saluto e chiudi.${retrySection}`;
}
