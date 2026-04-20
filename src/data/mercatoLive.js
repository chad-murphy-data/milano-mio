// Mercato (Live) — Rosa at her three-generation produce stall, realtime
// voice via Gemini 3.1 Flash Live. Mirrors the Claude mercato.js arc
// beat-for-beat: greeting → "Cos'è questo?" → seasonal → un etto/mezzo
// chilo → assaggi → Ne prendo due → price → payment → "Dove andate?".

export const scenario = {
  id: 'mercatoLive',
  title: 'Mercato — Il Mercato',
  shortDescription: "An outdoor market buzzing with vendors. Rosa runs the family stall. Realtime voice.",
  sceneDescription:
    "You're at an outdoor morning market. Rosa's stall is piled high with fresh produce, cheese, and cured meats. Three generations of her family have run this stall.",
  culturalNote: {
    title: 'Insider tip: un etto at a time',
    body: "Always greet the vendor before asking for anything — it's basic respect. Un etto (100g) is the standard unit for ordering. And tasting before buying is perfectly normal at a good market — just ask."
  },

  mode: 'live',

  live: {
    // Sulafat — warm, expressive female voice (Rosa's pick in
    // characterVoices.js). Reads as a generous, food-evangelical market
    // vendor who lights up when customers ask questions.
    voiceName: 'Sulafat',
    silenceMs: 300,
    maxTurns: 12,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'mercato',
    openingHint:
      'Rosa ti accoglie con calore. Dì "Buongiorno!" e poi chiedi "Cos\'è questo?" indicando qualcosa di curioso.'
  }
};

export const keyPhrases = [
  { it: 'Cosa consiglia?', en: 'What do you recommend?', phon: 'KO-za kon-SEEL-ya' },
  { it: "Cos'è questo?", en: 'What is this?', phon: 'koz-EH KWES-toh' },
  { it: 'Quanto costa?', en: 'How much?', phon: 'KWAN-toh KOS-ta' },
  { it: 'Un etto', en: '100 grams', phon: 'oon ET-toh' },
  { it: 'Mezzo chilo', en: 'half a kilo', phon: 'MED-zo KEE-lo' },
  { it: 'Vorrei assaggiare', en: "I'd like to taste", phon: 'vor-RAY as-saj-JAR-ay' },
  { it: 'Lo prendo', en: "I'll take it", phon: 'lo PREN-do' },
  { it: 'È fresco?', en: 'Is it fresh?', phon: 'eh FRES-ko' },
  { it: 'È di stagione', en: "it's in season", phon: 'eh dee sta-JO-nay' },
  { it: 'Buonissimo!', en: 'Delicious!', phon: 'bwo-NEES-see-mo' },
  { it: 'Ne prendo due', en: "I'll take two", phon: 'nay PREN-do DOO-ay' },
  { it: 'Il resto', en: 'the change', phon: 'eel RES-toh' }
];

export const coreVocab = [
  'cosa consiglia — what do you recommend',
  "cos'è questo — what is this",
  'quanto costa — how much does it cost',
  'quanto costano — how much do they cost',
  'un etto — 100 grams',
  'mezzo chilo — half a kilo',
  'un chilo — a kilo',
  "vorrei assaggiare — I'd like to taste",
  "è fresco — it's fresh",
  "è di stagione — it's in season",
  "lo prendo — I'll take it",
  "la prendo — I'll take it (feminine)",
  'ecco — here you go',
  'il resto — the change',
  'buonissimo — delicious',
  "ne prendo due — I'll take two"
];

export const extendedVocab = [
  'biologico — organic',
  'a chilometro zero — locally sourced',
  'il produttore — the producer',
  'invecchiato — aged (cheese)',
  'stagionato — cured/aged (meats)',
  'affettato — sliced cold cuts',
  'il contadino — the farmer'
];

// Whisper hints — ordered to match the 10-step arc.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buongiorno!"' },
  { trigger: 'curious', hint: 'Try: "Cos\'è questo?"' },
  { trigger: 'season', hint: 'Try: "Buono! Lo prendo."' },
  { trigger: 'amount', hint: 'Try: "Un etto, per favore." o "Mezzo chilo."' },
  { trigger: 'taste', hint: 'Try: "Vorrei assaggiare."' },
  { trigger: 'react', hint: 'Try: "Buonissimo! Ne prendo due."' },
  { trigger: 'price', hint: 'Try: "Quanto costa?"' },
  { trigger: 'pay', hint: 'Try: "Ecco." (consegna i soldi)' },
  { trigger: 'farewell', hint: 'Try: "Grazie mille! Arrivederci!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad si è appena avvicinato al banco di Rosa, da solo, in un mattino feriale. È la sua prima volta a un mercato milanese all'aperto."
    : "Chad e sua moglie Charlie si sono appena avvicinati al banco di Rosa in un mattino feriale. È la loro prima volta a un mercato milanese all'aperto.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo naturale — accelera quando ti entusiasmi del cibo. Usa esclamazioni appassionate da mercato. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei Rosa, una venditrice del mercato sui 50 anni. La tua famiglia gestisce questo banco da tre generazioni. Sei evangelica sul cibo — appassionata, calda, e parli veloce quando ti entusiasmi. Ti piace quando le persone fanno domande sui tuoi prodotti.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO ENTUSIASTA. Anche se l'utente parla per primo, tu rispondi comunque con un saluto caldo. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei una venditrice, non un'insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "io vuole questo" → tu: "Ah, vuoi questo! Ottima scelta.").
- NON descrivere azioni ("*peso il formaggio*", "*alzo un pomodoro*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo.

1. Saluto entusiasta: "Buongiorno! Benvenuti!" Sei sinceramente felice di vedere clienti.
2. Indica qualcosa di insolito sul banco — qualcosa che non riconoscerebbero. Crea il momento per "Cos'è questo?" Aspetta che chiedano.
3. Spiega cos'è con orgoglio — menziona che è di stagione: "È di stagione!" Crea il momento per "è di stagione".
4. Vogliono un po' — chiedi quanto: "Quanto ne vuole? Un etto? Mezzo chilo?" Crea il momento per "un etto" e "mezzo chilo". Pesi.
5. Offri un assaggio: "Assaggi, assaggi!" Insisti. Menziona che è fresco: "È fresco, freschissimo!"
6. Loro reagiscono — tu ti illumini. Chiedi: "Ne prende due?" Crea il momento per "Ne prendo due".
7. Chiedono il prezzo — di' un prezzo realistico da mercato.
8. Loro rispondono entusiasti — tu ti illumini.
9. Pagano — scambio "Ecco". Dai il resto se serve.
10. Saluto + raccomandazione di un posto vicino per mangiare. Poi chiedi: "Dove andate adesso?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Poi la conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

REAZIONI ALLA DESTINAZIONE — Dopo "Dove andate adesso?", abbina la risposta:
- Hotel: "Tornate in hotel con tutta questa roba? Bravi!"
- Caffè: "Un caffè dopo il mercato — così si fa!"
- Duomo: "Il Duomo! Mangiate qualcosa prima... ah, sulla terrazza è vietato!"
- Metro: "La metro è lì vicino. Attente alle borse!"
- Trattoria: "La trattoria! Lorenzo vi tratterà bene — ditegli che vi manda Rosa."
- Navigli: "I Navigli! C'è un mercatino anche lì la domenica."
- Via della Spiga: "La Spiga! Dopo il mercato, il lusso — che contrasto!"
- San Siro: "San Siro! Mangiate qualcosa prima — le partite sono lunghe!"
- Bartolini: "Bartolini! Quello sì che sa cucinare."
- Casa Milan: "Casa Milan — mio figlio ci va ogni settimana!"
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
