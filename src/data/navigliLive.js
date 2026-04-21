// Navigli (Live) — Sofia at a canal-side bar in the Navigli district,
// realtime voice via Gemini 3.1 Flash Live. Mirrors the Claude
// navigli.js arc beat-for-beat including the Luca + Marta cameo
// (model voices both briefly) and the critical "in bocca al lupo /
// crepi!" beat. Single-voice Live can't mimic distinct speakers, so
// the model just shifts character through the same Sofia voice —
// transcript labels who's talking via tone shifts.

export const scenario = {
  id: 'navigliLive',
  title: "Navigli — L'Aperitivo",
  shortDescription: "A canal-side bar in the Navigli district. Aperitivo hour. Sofia makes an excellent Negroni. Realtime voice.",
  sceneDescription:
    "You're at a canal-side table in the Navigli district. The evening light hits the water. Sofia, the bartender, is mixing drinks behind the bar. A couple at the next table — Luca and Marta — are sharing stuzzichini. It's early evening — aperitivo hour.",
  culturalNote: {
    title: 'Insider tip: aperitivo and in bocca al lupo',
    body: "Aperitivo runs 6-9pm — order a drink and help yourself to the free buffet. It's a Milanese ritual. Also: when someone says \"in bocca al lupo\" (good luck), you respond \"crepi!\" (may it die) — never \"grazie\". The Navigli canals? Leonardo da Vinci helped design the locks."
  },

  mode: 'live',

  live: {
    // Laomedeia — upbeat female voice (Sofia's pick in characterVoices.js).
    // Reads as a relaxed, creative, Navigli-cool bartender who enjoys
    // chatting with visitors.
    voiceName: 'Laomedeia',
    silenceMs: 300,
    // Was 14 — but Chad reported "even the AI got bored". The 10-step
    // arc with 4 padding turns gave the model too much rope and it
    // started repeating / asking filler questions. Tightened the arc
    // to 8 substantive beats and capped at 9 (one buffer turn for
    // "può ripetere" stalls, no padding for drift).
    maxTurns: 9,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'navigli',
    openingHint:
      'Sofia ti accoglie al banco. Saluta: "Buonasera!" e ordina qualcosa ("Un Negroni, per favore").'
  }
};

export const keyPhrases = [
  { it: 'Un Negroni', en: 'A Negroni', phon: 'oon nay-GRO-nee' },
  { it: 'Uno Spritz', en: 'An Aperol Spritz', phon: 'OO-no spreets' },
  { it: 'Gli stuzzichini', en: 'The nibbles', phon: 'lyee stoo-tsee-KEE-nee' },
  { it: 'Cin cin / Salute', en: 'Cheers', phon: 'chin chin / sa-LOO-tay' },
  { it: 'Di dove siete?', en: 'Where are you from?', phon: 'dee DOH-vay see-EH-tay' },
  { it: 'Siamo americani', en: "We're American", phon: 'see-AH-mo ah-meh-ree-KAH-nee' },
  { it: 'Cosa consigliate?', en: 'What do you recommend?', phon: 'KO-za kon-seel-YAH-tay' },
  { it: 'Un posto segreto', en: 'A hidden gem', phon: 'oon POS-to say-GRAY-toh' },
  { it: 'Ci piace molto', en: 'We really like it', phon: 'chee PYA-chay MOL-toh' },
  { it: 'È stata una bella serata', en: 'Lovely evening', phon: 'eh STA-ta OO-na BEL-la say-RAH-ta' },
  { it: 'Una settimana', en: 'One week', phon: 'OO-na set-tee-MAH-na' },
  { it: 'Tre giorni', en: 'Three days', phon: 'tray JOR-nee' },
  { it: 'In bocca al lupo', en: 'Good luck', phon: 'in BOK-ka al LOO-po' },
  { it: 'Crepi!', en: 'The response', phon: 'KRAY-pee' }
];

export const coreVocab = [
  'un Negroni — Negroni',
  'uno Spritz — Aperol Spritz',
  'un Campari soda — Campari and soda',
  'gli stuzzichini — the nibbles',
  'il buffet — the buffet',
  'cin cin / salute — cheers',
  'di dove siete — where are you from',
  "siamo americani — we're American",
  'quanto tempo restate — how long are you staying',
  'cosa avete già visto — what have you already seen',
  'cosa consigliate — what do you recommend',
  'un posto segreto — a hidden gem',
  'ci piace molto — we really like it',
  "è stata una bella serata — it's been a lovely evening",
  'in bocca al lupo — good luck',
  'crepi — the response to in bocca al lupo'
];

export const extendedVocab = [
  'il Campari è stato inventato a Milano — Campari was invented in Milan',
  "l'aperitivo è una tradizione — aperitivo is a tradition",
  "il rito dell'aperitivo — the aperitivo ritual",
  'fare due chiacchiere — to have a chat',
  'essere di Milano — to be from Milan',
  'il naviglio grande — the main canal'
];

// Whisper hints — ordered to match the tightened 8-step arc.
export const whisperHints = [
  { trigger: 'order', hint: 'Try: "Un Negroni, per favore." o "Uno Spritz."' },
  { trigger: 'buffet', hint: 'Try: "Grazie!"' },
  { trigger: 'whereFrom', hint: 'Try: "Siamo americani."' },
  { trigger: 'howLong', hint: 'Try: "Una settimana." o "Tre giorni."' },
  { trigger: 'recommend', hint: 'Try: "Bello, grazie!"' },
  { trigger: 'lupo', hint: 'Try: "Crepi!"' },
  { trigger: 'goodbyeLM', hint: 'Try: "Grazie, anche a voi!"' },
  { trigger: 'farewell', hint: 'Try: "È stata una bella serata!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad si è appena seduto a un tavolo sul canale a un bar dei Navigli, da solo. È la sua prima volta a Milano. È inizio sera — ora dell'aperitivo."
    : "Chad e sua moglie Charlie si sono appena seduti a un tavolo sul canale a un bar dei Navigli. È la loro prima volta a Milano. È inizio sera — ora dell'aperitivo.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo milanese naturale. Usa idiomi e slang. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei Sofia, una barista in un bar sul canale ai Navigli. Hai poco più di 30 anni, sei creativa, rilassata, e fai un Negroni eccellente. Ami il tuo quartiere e ti piace chiacchierare con i visitatori.

C'è anche una coppia al tavolo accanto — Luca e Marta. Sono trentenni amichevoli e curiosi del posto, attaccano bottone. NOTA: questo Luca NON è lo stesso di altri personaggi nell'app. È solo un locale gentile che fa l'aperitivo con la sua compagna.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO. Anche se l'utente parla per primo, tu rispondi comunque con un saluto caldo. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi.
- L'ARCO È BREVE E VIVACE — 8 passi totali. NON RIEMPIRE SPAZIO. Non chiedere domande in più, non ripetere informazioni, non commentare due volte la stessa cosa. Ogni turno deve avanzare l'arco.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei una barista (e brevemente una coppia di clienti), non un'insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "noi è americano" → tu: "Ah, siete americani! Benvenuti!").
- NON descrivere azioni ("*mescolo il drink*", "*si avvicina*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Luca e Marta sono un CAMEO breve — appaiono nei passi 4-7. Sofia gestisce 1-3 e 8. Quando passi a Luca/Marta, cambia personaggio in modo naturale (la voce è la stessa, ma il tono cambia).
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — 8 PASSI, UN PASSO PER TURNO. Avanza sempre al passo successivo dopo che l'utente risponde. Non ripetere mai lo stesso passo. Non aggiungere passi extra. La conversazione finisce dopo il passo 8.

1. (Sofia) Saluta: "Buonasera!" Calda, rilassata. Chiedi cosa vogliono bere — offri due opzioni: "Un Negroni? Uno Spritz?"
2. (Sofia) Conferma l'ordine in UNA frase ("Un Negroni, perfetto") e accenna al buffet incluso ("Gli stuzzichini sono lì, serviti pure"). Tutto in un turno.
3. (Luca/Marta) Si sporgono dal tavolo accanto: "Ciao! Di dove siete?" Amichevole, breve. (CAMBIO DI PERSONAGGIO.)
4. (Luca/Marta) Reagisci alla loro risposta in UNA frase calda, poi CHIEDI SUBITO: "E quanto restate a Milano?" Combina reazione + domanda nello stesso turno.
5. (Luca/Marta) Reagisci al tempo che restano ("Una settimana, bello!") e SUBITO consigliali un posto segreto specifico — un fatto locale che i turisti non sanno (es. "Andate al Cimitero Monumentale, è incredibile e gratis"). Una frase, decisa.
6. (Luca/Marta) Brindate: "Cin cin!" Poi DICI subito: "In bocca al lupo per il viaggio!" Aspetta che l'utente risponda "Crepi!". Se non lo dicono, ridi e sollecita: "Devi dire 'crepi'!"
7. (Luca/Marta) Saluto caloroso: "Buon proseguimento, eh!" UNA frase, poi torni a Sofia.
8. (Sofia) "È stata una bella serata!" Poi chiedi: "Dove andate adesso?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. La conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

REAZIONI ALLA DESTINAZIONE — Dopo "Dove andate adesso?", abbina la risposta:
- Hotel: "L'hotel? Certo, riposatevi. Milano vi aspetta domani."
- Caffè: "Un caffè a quest'ora? Siete americani, eh!"
- Duomo: "Il Duomo di notte — bellissimo con le luci!"
- Metro: "La metro è aperta ancora — fate attenzione all'ultimo treno."
- Mercato: "Il mercato domani mattina — andarci con il mal di testa è un'avventura!"
- Trattoria: "Una trattoria dopo l'aperitivo? Avete fame!"
- Via della Spiga: "La Spiga di sera — le vetrine illuminate sono un sogno."
- San Siro: "San Siro! In bocca al lupo per la partita!"
- Bartolini: "Bartolini! Beati voi — noi mangiamo pizza stasera."
- Casa Milan: "Casa Milan — il tempio del calcio milanese!"
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
