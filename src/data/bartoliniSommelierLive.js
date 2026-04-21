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
    maxTurns: 8,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'bartolini',
    // Elena's puppet asset is named elena_sommelier_* (there's also an
    // unrelated `elena_*` set), so override the auto-derived characterKey.
    puppet: {
      kind: 'headJaw',
      characterKey: 'elena_sommelier'
    },
    openingHint:
      'Elena si avvicina con il primo vino. Mostra interesse: "Buonasera, di che regione?"'
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

// Whisper hints — ordered to match Phase B's 8-step arc.
export const whisperHints = [
  { trigger: 'arrival', hint: 'Try: "Buonasera. Di che regione?"' },
  { trigger: 'firstWine', hint: 'Try: "Corposo o leggero?"' },
  { trigger: 'tasting', hint: 'Try: "È straordinario."' },
  { trigger: 'nextCourse', hint: 'Try: "Complimenti allo chef!"' },
  { trigger: 'secondWine', hint: 'Try: "Quale annata?"' },
  { trigger: 'dessertWine', hint: 'Try: "Secco o dolce?"' },
  { trigger: 'dessert', hint: 'Try: "Il sapore è incredibile."' },
  { trigger: 'farewell', hint: 'Try: "Grazie, è stata una serata straordinaria."' }
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

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo.

1. Arrivo al tavolo: saluto + presentazione del primo vino. UNA frase: "Buonasera. Per iniziare, un Franciacorta del 2018 — fresco, perfetto con i primi." Lascia che facciano una domanda (regione, corposo/leggero, ecc.).
2. Rispondi alla domanda in UNA frase elegante. "Dalla Lombardia, una bollicina raffinata. Le piace?"
3. Annuncio del secondo piatto + secondo vino. UNA frase: "Per il secondo, un Barolo del 2016. Corposo, della Langa." Invita un commento.
4. Loro reagiscono — accetta con grazia. "Ne sono lieta. Il Barolo esalta i sapori della carne."
5. Annuncio del pre-dessert (un sorbetto). UNA frase: "Un sorbetto al limone, per pulire il palato." Aspetta una breve reazione.
6. Annuncio del dolce + vino da meditazione. UNA frase: "Per concludere, un Passito di Pantelleria. Dolce, dorato." Invita un'impressione.
7. Loro commentano sul dolce. Reagisci calorosamente. "Una serata straordinaria, vero?"
8. Saluto finale e domanda di transizione: "Spero di rivederLa presto. E adesso, dove andate? Tornate in hotel, o ancora una passeggiata?" Aspetta la risposta. Quando dicono dove vanno, rispondi con UNA breve battuta elegante (improvvisa qualcosa di adeguato al posto). Poi la conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma sempre formale, e AVANZA comunque.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase elegante di saluto.${retrySection}`;
}
