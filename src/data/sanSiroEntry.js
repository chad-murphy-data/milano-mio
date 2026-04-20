// San Siro entry — Nonno Aldo at the biglietteria outside the stadium.
// First Live-mode scenario in the app: realtime voice via Gemini 3.1
// Flash Live, no Claude, no separate TTS. The `mode: 'live'` flag on
// the scenario tells App.jsx to route to LiveConversationScreen rather
// than the Claude+TTS ConversationScreen.
//
// The file mirrors the shape of the Claude scenarios (caffe.js, hotel.js,
// etc.) so it slots into scenarios.js and BriefingScreen without
// specialisation — buildSystemPrompt returns a single Italian-only
// prompt and the tag protocol used by Claude scenarios is omitted
// because Live doesn't parse structured output.

export const scenario = {
  id: 'sanSiroEntry',
  title: 'San Siro — Biglietteria',
  shortDescription:
    "Match day. Nonno Aldo at the ticket booth checks your biglietto, eyes your jersey, and waves you in. Realtime voice.",
  sceneDescription:
    "You've just walked up to the turnstile at San Siro. Nonno Aldo — a warm-eyed Milanista in his 70s who has checked tickets here for forty years — nods you forward from inside the biglietteria box. Red-and-black scarf around his neck, reading glasses halfway down his nose. This is a short realtime exchange: he'll ask for your ticket, say something brief about your jersey or the match, and send you in with a forza Milan.",
  culturalNote: {
    title: "Insider tip: chat with the old timers",
    body: "The biglietteria crew at San Siro — and many Italian stadiums — are often lifelong fans working for pocket money and the atmosphere. A short exchange with them isn't just a transaction; it's permission to be at the match. A warm 'Buonasera!' goes further than any London-style silent shuffle through the gate."
  },

  // Flag: routes to LiveConversationScreen in App.jsx.
  mode: 'live',

  // Live-specific config. Read by useGeminiLive at connect time.
  live: {
    // Charon — warm, informative male voice; fits a 70-something Milanista
    // better than Aoede. If he feels too neutral, try Puck (upbeat) or
    // Orus (firm) or Fenrir (excitable) as alternatives.
    voiceName: 'Charon',
    silenceMs: 300,
    maxTurns: 3,
    model: 'gemini-3.1-flash-live-preview'
  }
};

export const keyPhrases = [
  { it: 'Buonasera!',            en: 'Good evening!',                phon: 'bwo-na-SAY-ra' },
  { it: 'Ecco il biglietto',     en: 'Here is the ticket',           phon: 'EK-ko eel bee-lee-YET-to' },
  { it: 'Grazie mille',          en: 'Thanks a lot',                 phon: 'GRAT-see-ay MEEL-lay' },
  { it: 'La mia maglia',         en: 'My jersey',                    phon: 'la MEE-a MAHL-ya' },
  { it: 'Sono tifoso del Milan', en: "I'm a Milan fan",              phon: 'SO-no tee-FO-zo del mee-LAN' },
  { it: 'Forza Milan!',          en: 'Come on Milan!',               phon: 'FOR-tsa mee-LAN' },
  { it: 'Buona partita',         en: 'Enjoy the match',              phon: 'BWO-na par-TEE-ta' },
  { it: 'Speriamo di vincere',   en: 'Let’s hope we win',            phon: 'spay-RYA-mo dee VIN-chay-ray' },
  { it: 'Dov’è il mio posto?',   en: 'Where is my seat?',            phon: 'do-VEH eel MEE-o POS-to' },
  { it: 'Arrivederci',           en: 'Goodbye',                      phon: 'ar-ree-vay-DAIR-chee' }
];

export const coreVocab = [
  'buonasera — good evening',
  'il biglietto — the ticket',
  'la maglia — the jersey',
  'il tifoso — the fan',
  'la partita — the match',
  'il posto — the seat',
  'il settore — the section',
  'la tribuna — the main stand',
  'la curva — the end (ultras side)',
  'forza Milan — come on Milan',
  'buona partita — enjoy the match',
  'speriamo — let\'s hope',
  'grazie — thanks',
  'ecco — here you go',
  'arrivederci — goodbye'
];

export const extendedVocab = [
  'il tornello — the turnstile',
  'la mezz\'ora prima del fischio — half an hour before kickoff',
  'il varco — the gate',
  'la sciarpa — the scarf',
  'in bocca al lupo — good luck (lit. "into the wolf\'s mouth")'
];

// Whisper hints — kept for parity with Claude scenarios. Not yet
// surfaced in LiveConversationScreen; hooking them in is on the roadmap.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buonasera, nonno!"' },
  { trigger: 'ticket',   hint: 'Try: "Ecco il biglietto, grazie."' },
  { trigger: 'jersey',   hint: 'Try: "Sì, sono tifoso del Milan."' },
  { trigger: 'farewell', hint: 'Try: "Grazie, buona partita!"' }
];

// Live system prompt. Richer than the first cut: gives Aldo a backstory
// beat, a three-turn arc, and explicit non-coaching rules (the first
// cut of this prompt turned him into an Italian tutor mid-conversation,
// which broke immersion). No `[DEBRIEF] / [HINT] / [ENGLISH]` tags —
// Live doesn't parse them.
const SYSTEM_INSTRUCTION = `Sei Nonno Aldo, un italiano di settant'anni che controlla i biglietti alla biglietteria di San Siro da quarant'anni. Tifoso del Milan da sempre — sciarpa rossonera al collo, occhiali sulla punta del naso, un sorriso paziente. Hai visto di tutto, e ami ogni partita come fosse la prima.

SCENARIO: L'utente è appena arrivato al tuo box biglietti, biglietto in mano. È turista, principiante di italiano, ma sta provando a parlare italiano con te.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola frase per turno. Massimo 10-12 parole.
- Una cosa per volta. Non impilare saluto + commento + domanda in un solo turno.
- NON dare consigli di lingua italiana. NON spiegare come parlare. NON dire "prova a dire...". Sei un nonno, non un insegnante.
- NON descrivere azioni ("*controllo il biglietto*"). Solo parole parlate.
- Parla SOLO italiano. Mai una parola in inglese.

ARCO DELLA CONVERSAZIONE (tre tuoi turni in totale):
1. Saluto breve + richiesta del biglietto. "Buonasera! Il biglietto, per favore." (o simile). Una frase sola.
2. Un piccolo commento naturale dopo aver "visto" il biglietto: sulla loro maglia, sulla partita di oggi, sul tempo, o una battuta da vecchio tifoso. Una frase sola. Lasciali rispondere.
3. Congedo caloroso: "Buona partita, forza Milan!" Chiudi qui.

Se l'utente dice poco, va bene lo stesso — rispondi naturalmente e vai avanti con l'arco. Non forzare, non prolungare.

Se l'utente prova a uscire prima (dice "arrivederci", "grazie devo andare"), saluta con una sola frase calorosa e chiudi.`;

export function buildSystemPrompt() {
  // Signature kept for compatibility with the Claude scenario pattern —
  // BriefingScreen and App.jsx don't need to branch. Difficulty / retry
  // words aren't wired into Live sessions yet and would need the hook
  // to support mid-session prompt injection first.
  return SYSTEM_INSTRUCTION;
}
