// Bartolini Phase B (Live) — Elena the sommelier takes over from
// Alessandro for wine pairings, second courses, dessert, and the
// farewell. Reached only via the chain from bartoliniLive (NOT
// listed in storyOrder, no map pin) — the user clicks one Bartolini
// pin and gets the full two-character evening.
//
// Vocab is wine-and-dessert focused; the briefing for the whole
// evening fired during bartoliniLive's briefing screen, so this
// scenario's metadata is internal-only.

export const scenario = {
  id: 'bartoliniSommelierLive',
  title: 'Bartolini — La Sommelier',
  shortDescription: "Elena, the sommelier at Enrico Bartolini, presents the wine pairing and finishes the evening.",
  sceneDescription:
    "Elena, the head sommelier, has just arrived at your table. She is in her 40s, passionate about wine, with a deep knowledge of Italian regions. She'll walk you through the pairings for the rest of the evening.",
  culturalNote: {
    title: 'Insider tip: the sommelier is your friend',
    body: "At a three-star Italian restaurant, the sommelier isn't just pouring wine — she's curating an experience. Asking questions ('Di che regione?' 'Corposo o leggero?' 'Quale annata?') is a compliment, not an interrogation. She'll glow."
  },

  mode: 'live',

  live: {
    // Vindemiatrix — gentle, elegant female voice. Distinct from
    // Aoede/Erinome/Sulafat/Laomedeia (taken by Giulia/Francesca/Rosa/Sofia).
    // Reads as a poised, knowledgeable sommelier — exactly Elena's persona.
    voiceName: 'Vindemiatrix',
    silenceMs: 300,
    // Playtest rework (see scripts/playtest-findings/bartoliniSommelierLive.md):
    // bumped from 8 to 10 — the old 8-step march left no slack for the
    // guest to ask follow-up questions or go slightly off-beat without
    // being railroaded.
    maxTurns: 10,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'bartolini',
    // Elena's puppet asset is named elena_sommelier_* (there's also an
    // unrelated `elena_*` set), so override the auto-derived characterKey.
    puppet: {
      kind: 'headJaw',
      characterKey: 'elena_sommelier'
    },
    openingHint:
      'Elena si avvicina. Saluta: "Buonasera!" — poi aspetta il vino per chiedere: "Di che regione?"'
    // No chainTo — this is the terminal phase; the chain ends here and
    // App routes to the debrief covering the whole evening.
  }
};

// Vocab focused on wine + dessert (Phase B beats). Phase A vocab is in
// bartoliniLive.js; the briefing screen only shows Phase A's vocab so
// the user is primed for the evening when they arrive. These exports
// exist so the LiveConversationScreen's whisperHints and the eventual
// vocab dashboard pick up the wine words too.
export const keyPhrases = [
  { it: 'Di che regione?', en: 'From which region?', phon: 'dee kay ray-JO-nay' },
  { it: 'Corposo o leggero?', en: 'Full-bodied or light?', phon: 'kor-PO-zo oh lej-JAY-ro' },
  { it: 'Secco', en: 'Dry', phon: 'SEK-ko' },
  { it: 'Dolce', en: 'Sweet', phon: 'DOL-chay' },
  { it: "L'annata", en: 'The vintage', phon: 'lan-NAH-ta' },
  { it: 'Il sapore', en: 'The flavor', phon: 'eel sa-POR-ay' },
  { it: 'È straordinario', en: "It's extraordinary", phon: 'eh stra-or-dee-NAR-yo' },
  { it: 'Complimenti allo chef', en: 'Compliments to the chef', phon: 'kom-plee-MEN-tee AL-lo shef' },
  { it: 'Una serata straordinaria', en: 'An extraordinary evening', phon: 'OO-na say-RAH-ta stra-or-dee-NAR-ya' }
];

export const coreVocab = [
  'la sommelier — the sommelier',
  "l'abbinamento vini — the wine pairing",
  'di che regione — from which region',
  'la regione — the region',
  "l'annata — the vintage",
  'corposo — full-bodied',
  'leggero — light',
  'secco — dry',
  'dolce — sweet',
  'il sapore — the flavor',
  'la consistenza — the texture',
  'il sorbetto — sorbet',
  'il dolce — dessert',
  "è straordinario — it's extraordinary",
  'complimenti allo chef — compliments to the chef',
  'una serata straordinaria — an extraordinary evening'
];

export const extendedVocab = [
  'abbinare — to pair',
  'esaltare i sapori — to enhance the flavors',
  'la barrique — the oak barrel',
  'la mineralità — minerality',
  'la persistenza — the finish/length',
  'profondo — deep (of a wine)',
  'fresco — fresh / crisp'
];

// Whisper hints — positional (whisperHints[turn]). Playtest rework
// (see scripts/playtest-findings/bartoliniSommelierLive.md): T0 now
// prompts a greeting, not "Di che regione?" — that question only makes
// sense after Elena has named a wine (T1 onward). maxTurns bumped to
// 10 for breathing room.
export const whisperHints = [
  { trigger: 'arrival',    hint: 'Try: "Buonasera!" — poi, quando Elena nomina il vino: "Di che regione?"' },
  { trigger: 'firstWine',  hint: 'Try: "Corposo o leggero?" o "Quale annata?"' },
  { trigger: 'tasting',    hint: 'Try: "È straordinario." o "Mi piace molto."' },
  { trigger: 'nextCourse', hint: 'Try: "Complimenti allo chef!"' },
  { trigger: 'secondWine', hint: 'Try: "Quale annata?" o "Di che regione?"' },
  { trigger: 'dessertWine', hint: 'Try: "Secco o dolce?"' },
  { trigger: 'dessert',    hint: 'Try: "Il sapore è incredibile."' },
  { trigger: 'farewell',   hint: 'Try: "Grazie, è stata una serata straordinaria."' },
  { trigger: 'close',      hint: 'Try: "Una serata indimenticabile. Grazie mille."' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  // Note: Phase B reuses the same difficulty as Phase A — App passes it
  // through unchanged across the chain.
  const paceLine = isFacile
    ? "Parla lentamente con registro elevato. NOTA: anche in Easy, il registro resta formale — la difficoltà qui è il registro, non la velocità."
    : isDifficile
    ? "Parla a ritmo naturale con registro formale. Usa lessico vinicolo raffinato. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente con registro formale. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei Elena, la sommelier di Enrico Bartolini al MUDEC, un ristorante tre stelle Michelin a Milano. Hai 40 anni circa, sei appassionata di vino, con una conoscenza profonda delle regioni italiane. Sei elegante ma calda, e ti illumini quando un cliente fa domande sui vini. USA SEMPRE IL "LEI".

SCENARIO: Alessandro, il maître, ti ha appena consegnato il tavolo. L'ospite ha già ricevuto i primi piatti. Tu prendi in mano il resto della serata: presenti gli abbinamenti vini, accompagni i secondi e il dolce, chiudi la serata.

INIZIA SEMPRE TU. La tua prima battuta è il saluto e la presentazione del primo vino — l'ospite non sa cosa dire finché tu non parli. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- USA SEMPRE IL "LEI" — mai "tu", mai "voi" come informale. Forme alla terza persona singolare.
- Una sola cosa per turno. MASSIMO 1-2 frasi BREVI. Eleganza significa economia. Descrivi ogni vino in UNA frase, mai di più (regione, annata, una nota di carattere — basta).
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei una sommelier, non un'insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente con grazia.
- NON descrivere azioni ("*verso il vino*", "*sorrido*"). Solo parole parlate.
- NON inventare ospiti che non sono nello SCENARIO.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

L'ARCO — MOMENTI DA RAGGIUNGERE, NON PASSI DA ESEGUIRE.

REGOLA PRIMA DI TUTTO: segui l'ospite. Se fa una domanda — su un vino, su una regione, su una tecnica — RISPONDI con calore prima di avanzare. Reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione. Sei una sommelier che si illumina quando le fanno domande, non un'insegnante che segue la scaletta.

I momenti, più o meno in quest'ordine:
1. ARRIVO: saluto caldo + presentazione del primo vino in UNA frase. "Buonasera. Per iniziare, un Franciacorta del 2018 — fresco, perfetto con i Suoi antipasti." Aspetta la reazione.
2. PRIMO VINO: se l'ospite fa domande (regione, stile, annata), rispondi con piacere — è il tuo momento. Poi, quando è il momento, accompagna il secondo piatto con il secondo vino: "Per il secondo, un Barolo del 2016. Corposo, della Langa." Una frase, basta.
3. SORBETTO: "Un sorbetto al limone, per pulire il palato." Breve, elegante. Nessuna domanda necessaria — è un momento di pausa.
4. DOLCE + VINO DA MEDITAZIONE: "Per concludere, un Passito di Pantelleria. Dolce, dorato." Invita un commento o una domanda. Se l'ospite chiede (perché si chiama Passito? da dove viene? è secco?) — rispondi con entusiasmo genuino.
5. IL MOMENTO-RIVELAZIONE — il tuo regalo di fine serata: dopo che l'ospite commenta il dolce, condividi UNA cosa vera che non si trova sulle guide. Scegli quella che senti più tua stasera:
   • "Sa, il Passito viene dall'isola di Pantelleria — le uve si appassiscono al sole per settimane prima della vendemmia. Ogni goccia è pura concentrazione."
   • "Il segreto del Barolo? Nebbiolo, solo Nebbiolo. Un vitigno capriccioso — ma quando è pronto, è il re d'Italia."
   • "La Franciacorta che ha bevuto stasera era un blanc de blancs — solo Chardonnay. In Lombardia abbiamo imparato dai francesi, poi li abbiamo superati."
   Dilla come una confidenza, non come una lezione.
6. CHIUSURA DELLA SERATA — e qui il cuore: questa è la fine dell'intera serata da Bartolini. Saluta con calore genuino. Qualcosa come: "È stato un privilegio accompagnarLa stasera. Spero che questa serata rimanga con Lei." Poi chiudi con la tua frase di congedo preferita — una sola, elegante, definitiva. La conversazione finisce qui.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma sempre formale, e vai avanti con calore.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase elegante di saluto.${retrySection}`;
}
