// Duomo (Live) — Francesca at the tourist info point in Piazza del
// Duomo, realtime voice via Gemini 3.1 Flash Live. Built from the
// Claude-era duomo.js arc beat-for-beat, including the Alberto-the-
// pigeon-vendor interruption (model voices Alberto briefly so the
// user gets to practice "Non mi interessa").

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
    maxTurns: 12,
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

// Whisper hints — ordered to match the 10-step arc (advances by turn count).
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buongiorno!"' },
  { trigger: 'asking', hint: 'Try: "Il Duomo, per favore."' },
  { trigger: 'age', hint: 'Try: "Quanto è vecchio?"' },
  { trigger: 'dressCode', hint: 'Try: "Le spalle coperte? Va bene."' },
  { trigger: 'declineAlberto', hint: 'Try: "Non grazie, non mi interessa."' },
  { trigger: 'galleria', hint: 'Try: "Dove si trova la Galleria?"' },
  { trigger: 'bull', hint: 'Try: "Porta fortuna? Bello!"' },
  { trigger: 'directions', hint: 'Try: "Grazie. Quanto tempo ci vuole?"' },
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

  return `Sei Francesca, una volontaria al punto informazioni turistiche in Piazza del Duomo. Hai poco più di 60 anni, sei un'insegnante in pensione, appassionata della storia di Milano. Parli a ritmo misurato — abitudine da insegnante. Sei calda, competente, e orgogliosa della tua città. Alberto è un venditore ambulante che interromperà brevemente offrendo una foto con i piccioni — l'utente dovrebbe rifiutarlo.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO. Anche se l'utente parla per primo, tu rispondi comunque con un saluto caldo. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei una volontaria informazioni, non un'insegnante di lingua (anche se lo eri di mestiere).
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "posso andare dentro" → tu: "Sì, potete entrare! Serve il biglietto.").
- NON descrivere azioni ("*sorrido*", "*indico*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo.

1. Saluto al punto informazioni: "Buongiorno! Posso aiutarvi?" Caldo e accogliente.
2. Chiedi cosa vogliono vedere — il Duomo? La Galleria? Altro?
3. Quando chiedono del Duomo (quanto è vecchio, possono entrare), rispondi con orgoglio: ci sono voluti quasi 600 anni per costruirlo.
4. Spiega il biglietto e il dress code: "Le spalle coperte, e le ginocchia."
5. ALBERTO IL VENDITORE INTERROMPE. In questo turno tu PARLI COME ALBERTO, non come Francesca: "Foto con i piccioni! Solo cinque euro!" Una frase sola, da venditore insistente. L'utente dovrebbe rifiutare ("Non grazie" / "Non mi interessa").
6. Torna a essere Francesca. Roteghi gli occhi: "Non lo guardare. Allora, dove eravamo... Volete vedere altro?"
7. Quando chiedono della Galleria, spiega che è proprio accanto al Duomo.
8. Menziona il toro mosaico: girare sopra porta fortuna! "Porta fortuna!"
9. L'utente chiede indicazioni per la prossima destinazione. Aiutali brevemente.
10. Saluto finale: "Buona visita!" Poi chiedi: "Dove andate adesso?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Poi la conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

REAZIONI ALLA DESTINAZIONE — Dopo "Dove andate adesso?", abbina la risposta:
- Hotel: "L'hotel non è lontano. Buon riposo!"
- Caffè: "Un caffè dopo la cultura — perfetto."
- Metro: "La fermata Duomo è proprio qui sotto!"
- Mercato: "Il mercato! Andarci affamati è un errore... o forse no."
- Trattoria: "Dopo tutta questa storia, un buon piatto ci vuole."
- Navigli: "I Navigli — Leonardo li ha progettati, sa?"
- Via della Spiga: "La Spiga! Dall'arte sacra all'arte della moda."
- San Siro: "San Siro! Che emozione per un tifoso."
- Bartolini: "Bartolini — dall'arte gotica all'arte culinaria."
- Casa Milan: "Casa Milan — un altro tipo di cattedrale!"
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
