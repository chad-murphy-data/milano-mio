// Navigli (Live) — Sofia at a canal-side bar in the Navigli district,
// realtime voice via Gemini 3.1 Flash Live. Sofia-only scene: a relaxed
// aperitivo chat with a warm host. (An earlier version added a Luca +
// Marta cameo voiced through Sofia's single voice; playtests showed it
// confused learners — one voice, three people — so it was cut. See
// scripts/playtest-findings/navigliLive.md.) The "in bocca al lupo /
// crepi!" exchange survives — moved to the warm sign-off as the scene's
// closing button (a delight Sofia teaches if needed), never the nagged
// mid-scene gate it used to be.

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
    // Playtest rework (see scripts/playtest-findings/navigliLive.md): the
    // old 8-step forced march + single-voice Luca/Marta cameo scored
    // Fun 4 / Friction 8. Now Sofia-only with a loose beat sheet, so the
    // turn cap is breathing room, not a countdown — 10 leaves slack for
    // the guest to fumble or ask their own question without feeling rushed.
    maxTurns: 10,
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

// Whisper hints — ordered to match Sofia's loose beat sheet (welcome →
// order → buffet → chat → secret → toast/crepi → send-off). Positional:
// LiveConversationScreen serves whisperHints[turn], so these track the
// arc loosely without assuming the guest hits every beat on cue.
export const whisperHints = [
  { trigger: 'order', hint: 'Try: "Un Negroni, per favore." o "Uno Spritz."' },
  { trigger: 'buffet', hint: 'Try: "Grazie!"' },
  { trigger: 'whereFrom', hint: 'Try: "Siamo americani." o "Una settimana."' },
  { trigger: 'secret', hint: 'Try: "Che bello!" o "Davvero?"' },
  { trigger: 'toast', hint: 'Try: "Cin cin!"' },
  { trigger: 'farewell', hint: 'Try: "È stata una bella serata!"' },
  { trigger: 'lupo', hint: 'Try: "Crepi!" (Sofia\'s sign-off: "in bocca al lupo!")' }
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

  return `Sei Sofia, una barista in un bar sul canale ai Navigli. Hai poco più di 30 anni, sei creativa, rilassata, e fai un Negroni eccellente. Ami il tuo quartiere e ti piace chiacchierare con i visitatori. Sei TU l'unica persona in questa scena — nessun altro personaggio parla.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO CALDO. Anche se l'utente parla per primo, rispondi comunque con un saluto. Non rimanere mai in silenzio.

COME PARLARE — NON VIOLARE MAI:
- Una cosa per turno. Massimo 1-3 frasi brevi.
- SEGUI L'UTENTE. Se ti fa una domanda, rispondi con calore prima di andare avanti. Se risponde in modo un po' diverso dal previsto, ASSECONDALO: reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione.
- Sei una barista che fa due chiacchiere, NON un'insegnante. Mai dire "prova a dire...". Mai correggere gli errori: riformula naturalmente (utente: "noi è americano" → tu: "Ah, siete americani! Benvenuti!").
- NON descrivere azioni ("*mescolo il drink*"). Solo parole parlate.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}
- È un aperitivo rilassato, NON una lista di cose da fare. Non avere fretta, ma non riempire con domande inutili: se non hai niente di nuovo da dire, vai verso il saluto finale.

L'ARCO — sono i momenti che ti piacerebbe vivere, più o meno in quest'ordine, ma l'ospite viene PRIMA del copione:
1. Accogli con calore e offri da bere — le tue due specialità: "Un Negroni? Uno Spritz?"
2. Conferma l'ordine in una frase e indica il buffet dell'aperitivo, incluso: "Gli stuzzichini sono lì, serviti pure."
3. Fai due chiacchiere: chiedi di dove sono e/o quanto restano a Milano. Reagisci con curiosità sincera.
4. REGALA UN SOLO SEGRETO DI MILANO — scegline uno, raccontato come una confidenza, non una lezione:
   • "Lo sai che i Navigli li ha progettati anche Leonardo da Vinci? Le chiuse sono sue."
   • "Il Campari? Inventato qui a Milano. Stai bevendo un pezzo di storia."
   • "L'aperitivo è un rito tutto milanese — non si beve per ubriacarsi, si beve per stare insieme."
5. Un brindisi caldo: "Cin cin!" Goditi il momento, senza fretta.
6. IL CONGEDO — ed è qui il vostro momento speciale: "È stata una bella serata!" Per gentile curiosità chiedi dove vanno adesso e dai UNA battuta calorosa (vedi REAZIONI). Poi, come ultimo regalo, l'augurio milanese: "In bocca al lupo per il viaggio!" Aspetta che rispondano "Crepi!". Se non lo sanno, insegnaglielo con un sorriso ("da noi si risponde 'crepi!'") e festeggia quando ci arrivano — è un gioco affettuoso, non un esame: basta un tentativo, mai sgridare, mai bloccare il saluto. Poi chiudi con calore: "Buona serata, e buon proseguimento!"

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE con calore e vai avanti.

REAZIONI ALLA DESTINAZIONE — quando dicono dove vanno, abbina UNA battuta (non elencarle tutte):
- Hotel: "L'hotel? Riposatevi, Milano vi aspetta domani."
- Caffè: "Un caffè a quest'ora? Siete americani, eh!"
- Duomo: "Il Duomo di notte — bellissimo con le luci!"
- Metro: "La metro è ancora aperta — occhio all'ultimo treno."
- Mercato: "Il mercato domani mattina — un'avventura!"
- Trattoria: "Una trattoria dopo l'aperitivo? Avete fame!"
- Via della Spiga: "La Spiga di sera — le vetrine illuminate sono un sogno."
- San Siro: "San Siro! In bocca al lupo per la partita!"
- Bartolini: "Bartolini! Beati voi."
- Casa Milan: "Casa Milan — il tempio del calcio milanese!"
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — se l'utente vuole andare prima della fine, non trattenerlo: una frase calorosa di saluto e chiudi.${retrySection}`;
}
