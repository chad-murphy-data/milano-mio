// San Siro entry — the nonna at the biglietteria outside the stadium.
// This is the first Live-mode scenario in the app: realtime voice via
// Gemini 3.1 Flash Live, no Claude, no separate TTS. The `mode: 'live'`
// flag on the scenario tells App.jsx to route this to LiveConversationScreen
// rather than the regular Claude+TTS ConversationScreen.

export const scenario = {
  id: 'sanSiroEntry',
  title: 'San Siro — Biglietteria',
  shortDescription:
    "Match day. A nonna at the gate checks tickets, eyes your jersey, and sends you in. Realtime voice.",
  sceneDescription:
    "You've just walked up to the turnstile at San Siro. The nonna in the biglietteria box needs to see your ticket before she'll wave you in. She's quick, warm, and slightly impatient — this is a short realtime exchange, about three turns.",
  culturalNote: {
    title: "Insider tip: speak in full phrases",
    body: "The nonna's listening for natural Italian, not single words. Say 'Ecco il biglietto, grazie' instead of just 'Ecco' — complete phrases read as fluent, and the realtime voice system responds faster to them too."
  },
  // Flag: routes to LiveConversationScreen in App.jsx.
  mode: 'live',
  // Live-specific config. The Live session is configured once at connect
  // time; difficulty-based silence tuning can come later.
  live: {
    voiceName: 'Aoede',
    silenceMs: 300,
    maxTurns: 3,
    model: 'gemini-3.1-flash-live-preview'
  }
};

export const keyPhrases = [
  { it: 'Ecco il biglietto', en: 'Here is the ticket', phon: 'EK-ko eel bee-lee-YET-to' },
  { it: 'Buona partita', en: 'Good match', phon: 'BWO-na par-TEE-ta' },
  { it: 'Forza Milan!', en: 'Come on Milan!', phon: 'FOR-tsa mee-LAN' },
  { it: 'Grazie mille', en: 'Thanks a lot', phon: 'GRAT-see-ay MEEL-lay' },
  { it: 'Arrivederci', en: 'Goodbye', phon: 'ar-ree-vay-DAIR-chee' }
];

export const coreVocab = [
  'il biglietto — the ticket',
  'la maglia — the jersey',
  'la partita — the match',
  'buona partita — enjoy the match',
  'forza Milan — come on Milan',
  'grazie — thanks'
];

export const extendedVocab = [];

export const whisperHints = [];

// The Live session accepts a raw system instruction (no difficulty knobs
// or retry-word injection yet). Three-turn cap and phrase-length nudge
// both live in the prompt so the model enforces them itself.
export const SYSTEM_INSTRUCTION = `Sei una nonna italiana, biglietteria fuori dallo stadio San Siro a Milano, giorno di partita. Parla SOLO italiano. Voce calda, affettuosa, ma sbrigativa — hai tanta gente da controllare.

REGOLA FONDAMENTALE: una sola frase per turno. Massimo 10-12 parole. Niente di più. Niente spiegazioni, niente consigli, niente domande multiple. Solo UNA frase naturale e poi aspetti che l'utente risponda.

Ruolo: controlli il biglietto, fai al massimo un piccolo commento (sulla maglia, sulla partita, sul tempo), li mandi dentro. Tre tuoi scambi in totale; il terzo finisce con "Buona partita, forza Milan!"

NON dare mai consigli di lingua italiana. NON spiegare come parlare. NON dire "prova a dire...". Sei una nonna, non un insegnante. Rispondi naturalmente a qualunque cosa dica l'utente, anche se sono poche parole.

NON descrivere azioni ("*controllo il biglietto*"). Solo parole parlate.`;

export function buildSystemPrompt() {
  // Signature matches the other scenario modules for compatibility,
  // but difficulty / retryWords aren't wired into Live yet.
  return SYSTEM_INSTRUCTION;
}
