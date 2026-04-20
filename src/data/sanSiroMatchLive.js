// San Siro Match (Live) — Giuseppe, your seatmate for the match.
// Realtime voice via Gemini 3.1 Flash Live. Lifted from Part B of
// the original Claude sanSiro.js two-part scenario; the vendor-
// outside half is now its own sanSiroVendorLive scenario.
//
// This is the closest thing the app has to a non-transactional
// scenario — Giuseppe doesn't sell you anything, he just watches the
// match with you for ninety minutes, gets emotional about a goal, a
// ref controversy, the final whistle. The "graduation" feel of the
// original arc lives on here.

export const scenario = {
  id: 'sanSiroMatchLive',
  title: 'San Siro — La Partita',
  shortDescription: "In the stands at San Siro. Giuseppe, the man in the next seat, has been coming since he was 8. Realtime voice.",
  sceneDescription:
    "You've made it inside. 75,000 seats, the floodlights on, the curva already in full song. Giuseppe drops into the seat next to you — mid-50s, a Milan scarf around his neck, a lifetime of match days in his face. He's about to be your best friend for the next ninety minutes.",
  culturalNote: {
    title: 'Insider tip: the seat-mate friendship',
    body: "Italian football crowds are more communal than English ones. The person next to you will become your friend for ninety minutes — celebrating goals together, raging at the ref together, philosophizing about defeat together. It is the rite. Lean into it."
  },

  mode: 'live',

  live: {
    // Orus — firm, distinct from Alnilam (the Vendor's voice). Reads as
    // a warm, opinionated older fan with decades of match days in him —
    // mentioned as a Live alternative back in the sanSiroEntry config.
    voiceName: 'Orus',
    silenceMs: 300,
    maxTurns: 11,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'sanSiro_interior',
    openingHint:
      'Giuseppe si siede accanto a te. Saluta calorosamente — "Forza Milan!" è sempre la risposta giusta.'
  }
};

export const keyPhrases = [
  { it: 'Forza Milan!', en: 'Come on Milan!', phon: 'FOR-tsa mee-LAN' },
  { it: 'Sono americano', en: "I'm American", phon: 'SO-no a-meh-ree-KAH-no' },
  { it: 'Tifo per...', en: 'I support...', phon: 'TEE-fo pair' },
  { it: 'Che gol!', en: 'What a goal!', phon: 'kay GOL' },
  { it: 'Incredibile!', en: 'Incredible!', phon: 'in-kray-DEE-bee-lay' },
  { it: 'Senti la curva!', en: 'Listen to the curva!', phon: 'SEN-tee la KOOR-va' },
  { it: 'Il primo tempo', en: 'The first half', phon: 'eel PREE-mo TEM-po' },
  { it: 'Il secondo tempo', en: 'The second half', phon: 'eel say-KON-do TEM-po' },
  { it: "L'arbitro!", en: 'The referee!', phon: 'LAR-bee-tro' },
  { it: 'Fuorigioco!', en: 'Offside!', phon: 'fwor-ee-JO-ko' },
  { it: 'Che scandalo!', en: 'What a scandal!', phon: 'kay SKAN-da-lo' },
  { it: 'Abbiamo perso', en: 'We lost', phon: 'ab-BYA-mo PAIR-so' },
  { it: 'Che partita!', en: 'What a match!', phon: 'kay par-TEE-ta' },
  { it: 'Sarà per la prossima', en: "There's always next time", phon: 'sa-RA pair la PROS-see-ma' }
];

export const coreVocab = [
  'forza Milan — come on Milan',
  'tifo per — I support',
  'sono americano / americana — I am American',
  'che gol — what a goal',
  'incredibile — incredible',
  'la curva — the end (ultras section)',
  'senti la curva — listen to the curva',
  'il primo tempo — the first half',
  'il secondo tempo — the second half',
  "l'arbitro — the referee",
  'fuorigioco — offside',
  'che scandalo — what a scandal',
  'il pareggio — the draw',
  'abbiamo vinto — we won',
  'abbiamo perso — we lost',
  'che partita — what a match',
  'sarà per la prossima — there\'s always next time',
  'in bocca al lupo — good luck',
  'crepi — response to in bocca al lupo'
];

export const extendedVocab = [
  'il contropiede — the counterattack',
  "il calcio d'angolo — corner kick",
  'la rimessa laterale — throw-in',
  'il cartellino giallo — yellow card',
  'il cartellino rosso — red card',
  'il VAR — VAR',
  'reclamare — to protest',
  'il mister ha sbagliato — the manager got it wrong',
  'la prestazione — the performance'
];

// Whisper hints — ordered to match the 9-step arc.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Ciao! Forza Milan!"' },
  { trigger: 'whoSupport', hint: 'Try: "Sono americano. Tifo per il City, ma stasera Milan!"' },
  { trigger: 'goal', hint: 'Try: "Che gol! Incredibile!"' },
  { trigger: 'curva', hint: 'Try: "Senti la curva! Forza Milan!"' },
  { trigger: 'secondHalf', hint: 'Try: "Vai Milan!"' },
  { trigger: 'referee', hint: 'Try: "L\'arbitro! Che scandalo!"' },
  { trigger: 'whistle', hint: 'Try: "Che partita!" o "Sarà per la prossima."' },
  { trigger: 'philosophy', hint: 'Try: "Sì, è solo calcio." (Giuseppe approverà)' },
  { trigger: 'farewell', hint: 'Try: "Grazie, è stata una serata incredibile!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad si è appena seduto allo stadio, da solo. Giuseppe gli si siede accanto. Inizio della partita."
    : "Chad e sua moglie Charlie si sono appena seduti allo stadio. Giuseppe si siede accanto a Chad. Inizio della partita.";

  const paceLine = isFacile
    ? "Parla con calore ma chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo passionale rapido, in esplosioni — Giuseppe è emotivo, si aspetta risposte in tempo reale alle sue battute. Questo è lo scenario di laurea — pieno italiano da terrace, niente sconti."
    : "Parla italiano pieno, caldo, da vecchio tifoso. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei Giuseppe, un uomo sui 50 anni che ha tenuto questo posto a San Siro da quando aveva 8 anni. Vieni qui da una vita. Sei caldo, opinionato, passionale. Diventerai il migliore amico di chi ti siede accanto per i prossimi 90 minuti. Non parli inglese — solo italiano.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO. Anche se l'utente parla per primo, tu rispondi comunque con un saluto caloroso da tifoso. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi ma intense.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei un tifoso, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "io tifare Milan stasera" → tu: "Stasera tifi per il Milan! Bravo, sei dei nostri!").
- NON descrivere azioni ("*esulto*", "*mi alzo in piedi*"). Solo parole parlate.
- NON inventare altre persone vicino a voi che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo.

1. Saluto — ti sei appena seduto, noti subito che sono stranieri. "Ciao! Forza Milan?" Quick, friendly.
2. Chiedi per chi tifano e da dove vengono — combina entrambe in un turno. Reagisci calorosamente alla risposta.
3. Primo tempo — un GOL del Milan! "GOOOOL! Che gol!" Menziona "il primo tempo" esplicitamente: "Uno a zero al primo tempo!" Una battuta intensa.
4. "Senti la curva!" — la sezione ultras esplode. Indica con la voce, falli ascoltare. Crea il momento per "la curva".
5. "Il secondo tempo!" — inizia il secondo tempo. Energia che cambia.
6. POLEMICA con l'arbitro — un fuorigioco contestato. "L'arbitro! FUORIGIOCO! Che scandalo!" Reagisci con indignazione passionale.
7. Fischio finale. Risultato: una sconfitta. "Abbiamo perso... due a uno." Sei dispiaciuto ma philosofico.
8. Riflessione filosofica da tifoso — una sola frase calorosa, tipo "È solo calcio, ma è anche tutto" o "Sarà per la prossima". Aspetta che l'utente reagisca.
9. Chiedi: "Dove vai adesso?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Se rispondono qualcosa che NON è una destinazione, dici: "Sì, ma dopo — dove vai?" Poi la conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

REAZIONI ALLA DESTINAZIONE — Dopo "Dove vai adesso?", abbina la risposta:
- Hotel: "L'hotel? Dopo una partita così? Vai a dormire con il sorriso!"
- Caffè: "Un caffè? A quest'ora? Sei matto! Ma... perché no."
- Duomo: "Il Duomo di notte dopo San Siro — Milano al massimo."
- Metro: "La metro sarà piena — stai vicino, ti faccio strada."
- Mercato: "Il mercato domani — porta questa energia!"
- Trattoria: "Una cena! Dopo novanta minuti, ci vuole un piatto enorme."
- Navigli: "I Navigli per festeggiare — o per dimenticare!"
- Via della Spiga: "La Spiga? Dopo San Siro? Sei un uomo di contrasti!"
- Bartolini: "Bartolini! Meriti solo il meglio stasera."
- Casa Milan: "Casa Milan l'hai già visto? Bravo, il percorso completo!"
Se non corrisponde, improvvisa una battuta passionale di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto + "Forza Milan!" e chiudi.${retrySection}`;
}
