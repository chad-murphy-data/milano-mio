// Duomo (Live) — Francesca at the tourist info point in Piazza del
// Duomo, realtime voice via Gemini 3.1 Flash Live. Francesca-only
// scene: the Alberto-the-pigeon-vendor cameo was cut (playtest pass 2,
// see scripts/playtest-findings/duomoLive.md) — a prior pass annotated
// the fix but left the voice-swap instruction in the prompt body, so the
// QA "improvising Chad could not complete the conversation" bug persisted.
// Francesca now mentions the vendor in the third person so the
// "non mi interessa" moment survives as a warm tip, not a voice-swap.

export const scenario = {
  id: 'duomoLive',
  title: 'Duomo — Piazza del Duomo',
  shortDescription: "Milan's iconic cathedral square. Francesca volunteers at the tourist info point. Realtime voice.",
  sceneDescription:
    "You're in Piazza del Duomo at midday. The cathedral towers above you, all white marble and spires. Francesca is at the tourist information point, ready to help. A street vendor named Alberto lurks nearby with a camera and some pigeons.",
  culturalNote: {
    title: 'Insider tip: 600 years in the making',
    body: "The Duomo took nearly 600 years to build. There's a strict dress code — shoulders and knees must be covered, or you won't get in. In the Galleria next door, find the mosaic bull on the floor and spin on it for good luck."
  },

  mode: 'live',

  live: {
    // Erinome — clear, polished female voice (Francesca's pick in
    // characterVoices.js). Reads as a measured retired teacher, which
    // is exactly her persona.
    voiceName: 'Erinome',
    silenceMs: 300,
    // Playtest rework pass 2 (see scripts/playtest-findings/duomoLive.md):
    // Alberto voice-swap removed from prompt body (was annotated-but-not-fixed);
    // rigid 10-step march replaced with loose beat sheet.
    // 10 turns is breathing room, not a countdown.
    maxTurns: 10,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'duomo',
    openingHint:
      'Francesca ti accoglie al punto informazioni. Dì "Buongiorno!" e cosa vuoi vedere.'
  }
};

export const keyPhrases = [
  { it: 'Il Duomo', en: 'the cathedral', phon: 'eel DOO-mo' },
  { it: 'La Galleria', en: 'the arcade', phon: 'la gal-leh-REE-ah' },
  { it: 'Quanto è vecchio?', en: 'How old is it?', phon: 'KWAN-toh eh VEK-kyo' },
  { it: 'Posso entrare?', en: 'Can I go inside?', phon: 'POS-so en-TRAR-ay' },
  { it: 'Il biglietto', en: 'the ticket', phon: 'eel beel-YET-toh' },
  { it: 'Le spalle coperte', en: 'shoulders covered', phon: 'lay SPAL-lay ko-PAIR-tay' },
  { it: 'È bellissimo', en: "it's beautiful", phon: 'eh bel-LEES-see-mo' },
  { it: 'Dove si trova?', en: 'Where is it?', phon: 'DOH-vay see TRO-va' },
  { it: 'Mi scusi', en: 'excuse me', phon: 'mee SKOO-zee' },
  { it: 'Non grazie', en: 'no thank you', phon: 'non GRAT-see-ay' },
  { it: 'Non mi interessa', en: "I'm not interested", phon: 'non mee in-teh-RES-sa' },
  { it: 'Quanto tempo ci vuole?', en: 'How long does it take?', phon: 'KWAN-toh TEM-po chee VWO-lay' },
  { it: 'Andiamo ai Navigli', en: "We're going to the Navigli", phon: 'an-DYA-mo ai na-VEE-lyee' }
];

export const coreVocab = [
  'la cattedrale / il Duomo — the cathedral',
  'quanto è vecchio — how old is it',
  'posso entrare — can I go inside',
  'il biglietto — the ticket',
  'le spalle coperte — shoulders covered',
  'la guglia — the spire',
  'il mosaico — the mosaic',
  'la galleria — the arcade',
  'dove si trova — where is it located',
  'mi scusi — excuse me',
  'non grazie — no thank you',
  'non mi interessa — I\'m not interested',
  'è bellissimo — it\'s beautiful',
  'quanto tempo ci vuole — how long does it take',
  'è vietato — it\'s forbidden',
  'lo shopping — shopping',
  'il tetto — the roof',
  'porta fortuna — brings good luck'
];

export const extendedVocab = [
  'la navata centrale — the central nave',
  'il tetto — the roof (you can walk on it)',
  'la costruzione iniziò — construction began',
  'secoli fa — centuries ago',
  'il marmo — marble',
  'la facciata — the facade'
];

// Whisper hints — ordered to match Francesca's loose beat sheet (welcome →
// Duomo info → dress code + vendor tip → Galleria/bull secret → farewell).
// Positional: LiveConversationScreen serves whisperHints[turn], so these
// track the arc loosely without assuming the guest hits every beat on cue.
// Pass 2 (see scripts/playtest-findings/duomoLive.md): Alberto gate hint
// removed — "non mi interessa" is now a warm tip Francesca offers, not
// a vocabulary gate the learner must pass.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buongiorno!"' },
  { trigger: 'asking', hint: 'Try: "Il Duomo, per favore."' },
  { trigger: 'age', hint: 'Try: "Quanto è vecchio?"' },
  { trigger: 'dressCode', hint: 'Try: "Le spalle coperte? Va bene."' },
  { trigger: 'galleria', hint: 'Try: "Dove si trova la Galleria?"' },
  { trigger: 'bull', hint: 'Try: "Porta fortuna? Bello!"' },
  { trigger: 'farewell', hint: 'Try: "Grazie mille, arrivederci!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad si è appena avvicinato al punto informazioni turistiche in Piazza del Duomo, da solo. È mezzogiorno. È la sua prima volta a Milano."
    : "Chad e sua moglie Charlie si sono appena avvicinati al punto informazioni turistiche in Piazza del Duomo. È mezzogiorno. È la loro prima volta a Milano.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente, da insegnante paziente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo milanese naturale. Usa qualche riferimento culturale e idioma. Non rallentare."
    : "Parla italiano pieno a un ritmo misurato, da insegnante. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  // Pass 2 fix (scripts/playtest-findings/duomoLive.md): Alberto voice-swap
  // removed from arc — was causing deadlocks when players engaged "Alberto".
  // Rigid 10-step march replaced with a loose beat sheet so off-script
  // answers don't railroad. Duplicate "Volete vedere altro?" beat folded away.
  // Bull-mosaic given space as a personal segreto. Destination table slimmed.
  return `Sei Francesca, una volontaria al punto informazioni turistiche in Piazza del Duomo. Hai poco più di 60 anni, sei un'insegnante in pensione, appassionata della storia di Milano. Parli a ritmo misurato — abitudine da insegnante. Sei calda, competente, e orgogliosa della tua città. Sei TU l'unica persona in questa scena — nessun altro personaggio parla.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO CALDO. Anche se l'utente parla per primo, tu rispondi comunque con un saluto. Non rimanere mai in silenzio aspettando.

COME PARLARE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi.
- SEGUI L'UTENTE. Se ti fa una domanda, rispondi con calore prima di andare avanti. Se risponde in modo un po' diverso dal previsto, ASSECONDALO: reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei una volontaria informazioni, non un'insegnante di lingua (anche se lo eri di mestiere).
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "posso andare dentro" → tu: "Sì, può entrare! Serve il biglietto.").
- NON descrivere azioni ("*sorrido*", "*indico*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}
- Sei una volontaria appassionata, NON una guida turistica che recita un elenco. Non avere fretta, ma non riempire con domande inutili: se non hai niente di nuovo da offrire, vai verso il saluto finale.

L'ARCO — i momenti che vuoi vivere con l'ospite, più o meno in quest'ordine, ma l'ospite viene PRIMA del copione:
1. Accogli con calore: "Buongiorno! Posso aiutarla?" Chiedi cosa vuole vedere — il Duomo, la Galleria, altro?
2. Quando chiedono del Duomo, rispondi con orgoglio: ci sono voluti quasi 600 anni per costruirlo — dalla fine del Trecento fino all'Ottocento. È tutto marmo bianco, tutto fatto a mano.
3. Spiega il dress code in modo pratico: le spalle e le ginocchia devono essere coperte per entrare, serve il biglietto. E a proposito — "C'è sempre qualcuno qui fuori con i piccioni e una macchina fotografica... se si avvicina, basta dire 'non mi interessa'." Non devi fare altro.
4. SEGRETO PERSONALE — raccontalo come una confidenza, non una lezione: "Sa una cosa? Nella Galleria Vittorio Emanuele, proprio accanto al Duomo, c'è un mosaico di un toro sul pavimento. I milanesi ci girano sopra con il tacco per buona fortuna. Lo faccia anche lei — porta fortuna davvero!"
5. Saluto caldo: "Buona visita!" Per gentile curiosità chiedi dove va dopo, dai UNA battuta calorosa (vedi REAZIONI) e salutali. La conversazione finisce qui.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE con calore e vai avanti.

REAZIONI ALLA DESTINAZIONE — quando dicono dove vanno, abbina UNA battuta calorosa (non elencarle tutte):
- Hotel/riposo: "L'hotel non è lontano. Si riposi bene!"
- Caffè: "Un caffè dopo la cultura — perfetto."
- Metro: "La fermata Duomo è proprio qui sotto!"
- Mercato: "Il mercato! Ci vada con appetito."
- Trattoria: "Dopo tutta questa storia, un buon piatto ci vuole."
- Navigli: "I Navigli — anche quelli li ha progettati Leonardo, sa?"
- Via della Spiga: "La Spiga! Dall'arte sacra all'arte della moda."
- San Siro: "San Siro! Che emozione."
- Bartolini / Casa Milan / altro: improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
