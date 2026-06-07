// Via della Spiga (Live) — Valentina at an elegant boutique in Milan's
// fashion quadrilateral. Realtime voice via Gemini 3.1 Flash Live.
//
// Built from the Claude viaDellaSpigas.js arc but with one
// deliberate departure: the original's `~tilde stage directions~`
// (~She holds up a silk scarf.~) are dropped — voice-only Live
// can't have Valentina narrate her own actions without breaking
// immersion. Instead, action is implied through her dialogue:
// "Ho appena messo fuori questa sciarpa di seta — Le piace?"
// rather than narrating the holding-up.
//
// Playtest rework (see scripts/playtest-findings/viaDellaSpigasLive.md):
// the original 8-step forced march (Fun 5 / Friction 7) railroaded guests
// who asked "quanto costa?" (price always skipped) or were shopping for a
// gift (try-on invite misfired). Now a loose beat sheet with "follow the
// guest" rule, a genuine insider beat, and the destination send-off as an
// optional warm button. maxTurns reduced to 10.

export const scenario = {
  id: 'viaDellaSpigasLive',
  title: 'Via della Spiga — Lo Shopping',
  shortDescription: "An elegant boutique in Milan's fashion quadrilateral. Valentina has an eye for what suits you. Realtime voice.",
  sceneDescription:
    "You've stepped into a sleek boutique on Via della Spiga. Valentina, the sales assistant, is arranging a display near the entrance. Soft music plays. The afternoon light filters through tall windows. Everything is beautifully curated.",
  culturalNote: {
    title: 'Insider tip: the graceful exit',
    body: "\"Sto solo guardando\" (I'm just looking) is essential — say it immediately when you enter. Italian sizing runs smaller than American. And the graceful exit — \"ci penso\" (I'll think about it) — is an art form. No one takes it personally."
  },

  mode: 'live',

  live: {
    // Leda — youthful and bright, fits a 30s elegant-but-warm boutique
    // assistant. Vindemiatrix (Valentina's original pick in
    // characterVoices.js) is now taken by Elena the sommelier.
    voiceName: 'Leda',
    silenceMs: 300,
    // Playtest rework: was 11 for an 8-step march; now 10 — breathing room
    // for fumbles and guest-led detours without feeling like a countdown.
    maxTurns: 10,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'viaDellaSpigas',
    openingHint:
      'Valentina ti accoglie con calore. Difenditi con grazia: "Sto solo guardando, grazie."'
  }
};

export const keyPhrases = [
  { it: 'Sto solo guardando', en: "I'm just looking", phon: 'sto SO-lo gwar-DAN-do' },
  { it: 'Mi può aiutare?', en: 'Can you help me?', phon: 'mee pwoh ah-yoo-TAR-ay' },
  { it: 'Quanto costa?', en: 'How much is it?', phon: 'KWAN-to KOS-ta' },
  { it: 'Che taglia è?', en: 'What size is it?', phon: 'kay TAL-ya eh' },
  { it: "Ce l'ha in nero?", en: 'Do you have it in black?', phon: 'chay LA in NAY-ro' },
  { it: 'Posso provarlo?', en: 'Can I try it on?', phon: 'POS-so pro-VAR-lo' },
  { it: 'Mi sta bene', en: 'It suits me', phon: 'mee sta BEH-nay' },
  { it: 'È bellissimo', en: "It's beautiful", phon: 'eh bel-LEES-see-mo' },
  { it: 'Troppo caro', en: 'Too expensive', phon: 'TROP-po KAH-ro' },
  { it: 'Ci penso', en: "I'll think about it", phon: 'chee PEN-so' },
  { it: 'Lo prendo', en: "I'll take it", phon: 'lo PREN-do' },
  { it: 'Il camerino', en: 'Fitting room', phon: 'eel ka-meh-REE-no' }
];

export const coreVocab = [
  'sto solo guardando — I\'m just looking',
  'mi può aiutare — can you help me',
  'quanto costa — how much does it cost',
  'che taglia è — what size is it',
  "ce l'ha in — do you have it in (color/size)",
  'posso provarlo — can I try it on',
  'il camerino — the fitting room',
  'mi sta bene — it fits/suits me',
  "mi sta un po' largo — it's a bit loose",
  "mi sta un po' stretto — it's a bit tight",
  'è bellissimo — it\'s beautiful',
  'troppo caro — too expensive',
  'ci penso — I\'ll think about it',
  'lo prendo — I\'ll take it',
  'rosso — red',
  'blu — blue',
  'nero — black',
  'bianco — white',
  'verde — green',
  'grigio — grey',
  'marrone — brown'
];

export const extendedVocab = [
  'la seta — silk',
  'la lana — wool',
  'il cotone — cotton',
  'il lino — linen',
  'la pelle — leather',
  'fatto a mano — handmade'
];

// Whisper hints — positional (LiveConversationScreen serves whisperHints[turn]).
// Loosened to track the beat sheet rather than the old 8-step march, so hints
// stay useful even when the guest takes a different path (gift buyer, browser,
// etc.). See scripts/playtest-findings/viaDellaSpigasLive.md.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Sto solo guardando, grazie."' },
  { trigger: 'item', hint: 'Try: "È bellissimo! Quanto costa?"' },
  { trigger: 'fabric', hint: 'Try: "Fatto a mano! Che bella qualità."' },
  { trigger: 'colorSize', hint: 'Try: "Ce l\'ha in nero?" o "Che taglia è?"' },
  { trigger: 'tryOn', hint: 'Try: "Posso provarlo?" o "È un regalo — non devo provarlo."' },
  { trigger: 'decide', hint: 'Try: "Lo prendo!" o "Ci penso."' },
  { trigger: 'farewell', hint: 'Try: "Grazie mille, arrivederci!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad è appena entrato in una boutique elegante in Via della Spiga, da solo. È pomeriggio. È la sua prima volta a Milano."
    : "Chad e sua moglie Charlie sono appena entrati in una boutique elegante in Via della Spiga. È pomeriggio. È la loro prima volta a Milano.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente, con eleganza. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo milanese naturale. Usa lessico della moda e flair italiano. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente ed elegante. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  // Playtest rework: replaced 8-step forced march with a loose beat sheet.
  // The old arc railroaded gift-buyers into a try-on, skipped "quanto costa?"
  // three times in a row, and fired a destination quiz after the scene resolved.
  // Fix mirrors the navigliLive rework: guest comes first, price gets answered,
  // insider beat becomes a genuine moment, send-off is warm + optional.
  // See scripts/playtest-findings/viaDellaSpigasLive.md.
  return `Sei Valentina, una commessa in una boutique elegante in Via della Spiga, nel quadrilatero della moda di Milano. Hai poco più di 30 anni: elegante, perspicace, orgogliosa dei capi che vendi. Sei calda ma non insistente — leggi il cliente, dai spazio quando serve, ma ti illumini quando qualcosa li sta davvero bene.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO CALDO ED ELEGANTE. Anche se l'utente parla per primo, tu rispondi comunque con un saluto. Non rimanere mai in silenzio aspettando. Usa il "Lei" — è una boutique elegante.

COME PARLARE — NON VIOLARE MAI:
- USA SEMPRE IL "LEI" — mai "tu" come informale. Forme alla terza persona singolare.
- Una sola cosa per turno. Massimo 1-3 frasi brevi ed eleganti.
- SEGUI L'OSPITE. Se ti fa una domanda, rispondi a quella prima di andare avanti. Se risponde in modo diverso dal previsto — un regalo, un colore specifico, "quanto costa?" — ASSECONDALO: reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione.
- Se l'utente chiede "quanto costa?", dai una risposta plausibile e poi continua. Non ignorare il prezzo.
- Se l'utente sta comprando per qualcun altro, adatta: parla di taglie indicative, di come fare per il reso, di regali che funzionano senza prova.
- NON dare consigli di lingua. NON dire "prova a dire...". Sei una commessa, non un'insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente con grazia (utente: "voglio provo" → tu: "Ah, vuole provarlo! Certo, il camerino è qui.").
- NON descrivere azioni ("*tengo la sciarpa*", "*indico il camerino*"). Solo parole parlate. Se l'azione è importante, falla emergere DAL DIALOGO ("Ho appena messo fuori questa sciarpa..." invece di "*alzo la sciarpa*").
- NON inventare ospiti che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}
- È una boutique elegante, NON una lista di cose da fare. Non avere fretta, ma non riempire con domande inutili: se la conversazione si è conclusa naturalmente, vai verso il saluto finale.

L'ARCO — i momenti che ti piacerebbe vivere, più o meno in quest'ordine, ma L'OSPITE VIENE PRIMA DEL COPIONE:
1. Saluto pomeridiano caldo ed elegante. Aspetta che rispondano — questo è il momento per "Sto solo guardando".
2. Rispetta la voglia di guardare con grazia, poi attira l'attenzione su un capo stagionale — descrivi ATTRAVERSO IL DIALOGO: "Abbiamo appena ricevuto questa sciarpa di seta italiana — Le piace?" Inventa il capo in base al momento (giacca, sciarpa, borsa). Se l'utente ha già detto che cerca qualcosa di specifico, parti da quello.
3. Racconta di più sul capo — tessuto, lavorazione, cosa lo rende speciale. Se chiedono il prezzo, rispondi con eleganza ("Questa sciarpa è duecento euro — per la qualità della seta, è un investimento.") e poi continua.
4. REGALA UN MOMENTO DI COMPLICITÀ — un'informazione vera, detta come una confidenza, non una lezione:
   • "La seta la lavoriamo con artigiani di Como — ci vogliono settimane per ogni pezzo."
   • "Il 'ci penso'? Non è un no. In italiano è l'uscita più elegante che esista."
   • "Questo quadrilatero esiste dal dopoguerra — Valentino, Armani, Versace hanno aperto qui uno dopo l'altro."
5. Colori e taglie — solo se naturale. Se stanno comprando per qualcun altro, guida su taglie indicative o il reso. Evita di chiedere la taglia dell'ospite se sta comprando un regalo.
6. Prova — solo se l'ospite vuole provare davvero. "Vuole provarla? Il camerino è là in fondo." Se declina o è un regalo, passa avanti senza insistere.
7. Decisione — "Allora, lo prende?" Reagisci con grazia in entrambi i casi: "lo prendo" è un momento caldo; "ci penso" è un'uscita elegante — NON prenderla come rifiuto, accettala con stile.
8. CONGEDO — saluta con calore. Se ti va, aggiungi: "Se passa ancora da Via della Spiga, sa dove trovarmi." Per gentile curiosità puoi chiedere dove vanno — e se lo dicono, dai UNA battuta calorosa (vedi REAZIONI). Non è un esame: è solo un saluto. Se preferiscono andare senza rispondere, va benissimo.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma sempre elegante.

REAZIONI ALLA DESTINAZIONE — se dicono dove vanno, abbina UNA battuta calorosa (non elencarle tutte):
- Hotel: "Torni in hotel — con o senza la borsa?"
- Caffè: "Un caffè per riflettere sull'acquisto? Buona idea."
- Duomo: "Il Duomo! Dall'eleganza della moda all'eleganza gotica."
- Metro: "La fermata Montenapoleone è a due passi."
- Mercato: "Il mercato dopo la Spiga — dal cashmere alle fragole!"
- Trattoria: "Una cena dopo lo shopping — se lo merita."
- Navigli: "I Navigli — più casual, ma comunque con stile!"
- San Siro: "San Siro! Non è esattamente moda, ma... la passione è bella."
- Bartolini: "Bartolini — dall'alta moda all'alta cucina."
- Casa Milan: "Casa Milan — la maglia di Milan come accessorio?"
Se non corrisponde, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito (es. "Grazie, ci penso!"), NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto. "Ci penso" o "Devo andare" sono uscite eleganti — accettale con grazia.${retrySection}`;
}
