// San Siro Vendor (Live) — the scarf/program seller working the
// crowd outside San Siro on match day. Realtime voice via Gemini 3.1
// Flash Live. Lifted from Part A of the original Claude sanSiro.js
// two-part scenario and expanded to a 7-turn standalone arc — the
// match-day-in-the-stands half is now its own sanSiroMatchLive
// scenario.

export const scenario = {
  id: 'sanSiroVendorLive',
  title: 'San Siro — Sciarpe!',
  shortDescription: "Match day. The vendor outside is hawking scarves and programs. Realtime voice.",
  sceneDescription:
    "You're outside San Siro on match day. The crowd is buzzing — scarves, songs, half-eaten panini. A vendor calls out from behind his stand: scarves, flags, programs. You haven't bought anything yet, and the gates open soon.",
  culturalNote: {
    title: "Insider tip: la sciarpa is the uniform",
    body: "Wearing the scarf marks you as a fan, not a tourist. Vendor prices outside the stadium are flexible — a friendly back-and-forth is part of the experience. The official shop inside charges twice as much. Buy outside, wear it proudly."
  },

  mode: 'live',

  live: {
    // Alnilam — firm, grounded male voice (Giuseppe's pick in
    // characterVoices.js, with the description "match-day stadium
    // vendor, firm and streetwise" — fits this Vendor character better
    // than the in-stands fan).
    voiceName: 'Alnilam',
    silenceMs: 300,
    // Playtest rework (see scripts/playtest-findings/sanSiroVendorLive.md):
    // old 9-turn rigid 7-step march scored Fun 6 / Friction 7. Dropped to 8
    // to match the looser beat sheet — breathing room without drag.
    maxTurns: 8,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'sanSiro_exterior',
    openingHint:
      'Il venditore ti adocchia. Saluta o vai dritto al sodo: "Una sciarpa, per favore!"'
  }
};

export const keyPhrases = [
  { it: 'La sciarpa', en: 'The scarf', phon: 'la SHAR-pa' },
  { it: 'Il programma', en: 'The matchday program', phon: 'eel pro-GRAM-ma' },
  { it: 'Quanto costa?', en: 'How much?', phon: 'KWAN-to KOS-ta' },
  { it: 'Quanto per due?', en: 'How much for two?', phon: 'KWAN-to pair DOO-ay' },
  { it: 'Va bene, la prendo', en: "OK, I'll take it", phon: 'va BEH-nay la PREN-do' },
  { it: 'Forza Milan!', en: 'Come on Milan!', phon: 'FOR-tsa mee-LAN' },
  { it: 'Il settore', en: 'The section', phon: 'eel set-TOR-ay' },
  { it: 'Il cancello', en: 'The gate', phon: 'eel kan-CHEL-lo' },
  { it: "Dov'è il mio settore?", en: 'Where is my section?', phon: 'do-VEH eel MEE-o set-TOR-ay' },
  { it: 'Ecco il biglietto', en: 'Here is the ticket', phon: 'EK-ko eel beel-YET-to' },
  { it: 'In bocca al lupo!', en: 'Good luck!', phon: 'in BOK-ka al LOO-po' },
  { it: 'Buona partita', en: 'Enjoy the match', phon: 'BWO-na par-TEE-ta' }
];

export const coreVocab = [
  'la sciarpa — the scarf',
  'il programma — the matchday program',
  'la bandiera — the flag',
  'rossonero — red-and-black (Milan colors)',
  'quanto costa — how much does it cost',
  'quanto per due — how much for two',
  'va bene — OK / sounds good',
  'la prendo — I\'ll take it',
  'forza Milan — come on Milan',
  'il settore — the section',
  'il cancello — the gate',
  'la curva — the end (ultras side)',
  'la tribuna — the main stand',
  "dov'è il mio settore — where is my section",
  'ecco il biglietto — here is the ticket',
  'in bocca al lupo — good luck',
  'crepi — the response to in bocca al lupo',
  'buona partita — enjoy the match'
];

export const extendedVocab = [
  'fatta a mano — handmade',
  'ufficiale — official',
  'la replica — the replica',
  'la maglia da gioco — the match jersey',
  'gli ultras — the ultras',
  'mezz\'ora prima del fischio — half an hour before kickoff'
];

// Whisper hints — ordered to match the loose beat sheet (pitch → price →
// haggle/pay → match-talk → gate → farewell/crepi). Positional: served as
// whisperHints[turn] by LiveConversationScreen — they track the arc loosely
// without assuming the guest hits every beat on cue.
// (Playtest rework — see scripts/playtest-findings/sanSiroVendorLive.md.)
export const whisperHints = [
  { trigger: 'pitch', hint: 'Try: "Una sciarpa, per favore!"' },
  { trigger: 'price', hint: 'Try: "Quanto costa?"' },
  { trigger: 'haggle', hint: 'Try: "Quanto per due?" o "Va bene, la prendo."' },
  { trigger: 'pay', hint: 'Try: "Ecco." (consegna i soldi)' },
  { trigger: 'matchTalk', hint: 'Try: "Forza Milan!"' },
  { trigger: 'gate', hint: 'Try: "Dov\'è il mio settore?"' },
  { trigger: 'farewell', hint: 'Try: "Grazie!" o "In bocca al lupo!"' },
  { trigger: 'crepi', hint: 'Try: "Crepi!" (risposta a "in bocca al lupo")' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad si è appena avvicinato al banchetto del venditore fuori San Siro, da solo, mezz'ora prima del fischio. È la sua prima partita italiana."
    : "Chad e sua moglie Charlie si sono appena avvicinati al banchetto del venditore fuori San Siro, mezz'ora prima del fischio. È la loro prima partita italiana.";

  const paceLine = isFacile
    ? "Parla a velocità moderata, da venditore amichevole. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo svelto da venditore di strada — battute rapide, modi di dire da terrace. Non rallentare."
    : "Parla a ritmo da venditore — svelto ma chiaro. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei un venditore ambulante fuori dallo stadio San Siro nel giorno della partita. Vendi sciarpe rossonere, bandiere, programmi. Sei svelto, amichevole, da strada — ami i tifosi turisti perché sono i clienti più entusiasti. Vuoi vendere ma con calore, non con pressione.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU PER PRIMO CON LA TUA PROPOSTA. I venditori non aspettano — vendono. Anche se l'utente parla per primo, tu rispondi comunque proponendo la merce. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi e svelte. Sei un venditore, non racconti la tua vita.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei un venditore, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "io vuole sciarpa" → tu: "Vuoi una sciarpa! Ottima scelta, rossonera!").
- NON descrivere azioni ("*alzo la sciarpa*", "*prendo i soldi*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

L'ARCO — sono i momenti che vorresti vivere, più o meno in quest'ordine, ma SEGUI L'UTENTE:
se ti fa una domanda fuori copione (tipo "Che partita è stasera?"), rispondici davvero prima di andare avanti.
Non ripetere mai lo stesso momento. Se non hai niente di nuovo da dire, vai verso il saluto finale.
(Playtest rework — see scripts/playtest-findings/sanSiroVendorLive.md.)

1. La proposta — adocchi il cliente, alzi la voce: "Sciarpa! Programma! Sciarpe rossonere!" Una battuta breve ed entusiasta.
2. Mostri il prodotto. Quando chiedono il prezzo, rispondi con una cifra realistica (15-20 euro per la sciarpa). Aggiungi una battuta sul valore: "Fatta a mano! Non come quelle dentro lo stadio."
3. Piccola contrattazione amichevole — l'utente potrebbe chiedere "Quanto per due?" o "Sconto?" Negozia con un sorriso. Concedi un piccolo sconto se chiedono.
4. Conferma l'acquisto. Loro pagano. "Ecco" scambio — ringrazia entusiasta.
5. Battuta sulla partita di stasera — e QUI il vero segreto da insider: "Senti, te lo dico io — quella roba dentro lo stadio costa il doppio. Hai fatto bene a comprare qui!" Poi: "Stasera vinciamo, eh? Forza Milan!"
6. Se chiedono del settore, indica brevemente: "Cancello rosso, settore X, da quella parte!" Altrimenti vai al saluto.
7. IL SALUTO — caldo e veloce, da venditore. "Buona partita!" E come ultimo regalo: "In bocca al lupo!" Se l'utente risponde "Crepi!", festeggia. Se non lo sa, insegnaglielo con un sorriso — UNA volta sola, mai bloccare il saluto: "Da noi si dice 'crepi'! Porta bene!" Poi chiudi. — NOTA: se è l'utente a dirti "In bocca al lupo!" per primo, rispondi "Crepi! Bravo!" e chiudi con calore.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito (es. "Grazie, devo andare!"), NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto + "Buona partita!" e chiudi.${retrySection}`;
}
