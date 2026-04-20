// Casa Milan (Live) — Paolo at the Casa Milan museum + merch shop,
// realtime voice via Gemini 3.1 Flash Live. Mirrors the Claude
// casaMilan.js arc beat-for-beat: greet → "Per chi tifi?" → museum
// tour → memorabilia → squad talk → Napoli fan cameo → shop → "Dove
// vai?". Same single-voice cameo limitation as Sofia/Navigli.

export const scenario = {
  id: 'casaMilanLive',
  title: 'Casa Milan — Il Museo',
  shortDescription: "Casa Milan complex. Museum, trophy room, merch shop. Paolo has opinions. Realtime voice.",
  sceneDescription:
    "You're inside the Casa Milan complex — the museum, trophy room, and official merch shop of AC Milan. Paolo, a shop assistant and passionate Milan fan in his 30s, is arranging jerseys near the entrance. The Champions League trophies gleam behind glass.",
  culturalNote: {
    title: 'Insider tip: football culture',
    body: "San Siro (officially Stadio Giuseppe Meazza) holds 75,000. The Curva Sud is the Milan ultras end. Paolo will absolutely want to know which team you support — have your answer ready. In Italy, football isn't a sport. It's identity."
  },

  mode: 'live',

  live: {
    // Fenrir — excitable, animated male voice (Paolo's pick in
    // characterVoices.js). Reads as a passionate AC Milan fan with
    // infinite football opinions.
    voiceName: 'Fenrir',
    silenceMs: 300,
    maxTurns: 14,
    model: 'gemini-3.1-flash-live-preview',
    backdropKey: 'casaMilan',
    openingHint:
      'Paolo ti accoglie tra le maglie. Saluta: "Ciao!" e poi rispondi quando ti chiede per chi tifi.'
  }
};

export const keyPhrases = [
  { it: 'Il tifoso', en: 'The fan', phon: 'eel tee-FO-zo' },
  { it: 'Tifare per', en: 'To support (a team)', phon: 'tee-FAR-ay pair' },
  { it: 'La maglia', en: 'The jersey', phon: 'la MAL-ya' },
  { it: 'Il campionato', en: 'The league', phon: 'eel kam-pyo-NAH-toh' },
  { it: 'La Champions League', en: 'Champions League', phon: 'la CHAM-pyons leeg' },
  { it: 'Segnare', en: 'To score', phon: 'sen-YAR-ay' },
  { it: 'Il portiere', en: 'Goalkeeper', phon: 'eel por-TYAY-ray' },
  { it: "L'attaccante", en: 'Striker', phon: 'lat-tak-KAN-tay' },
  { it: 'La vittoria', en: 'Victory', phon: 'la vit-TOR-ya' },
  { it: 'La sconfitta', en: 'Defeat', phon: 'la skon-FIT-ta' },
  { it: 'Il mister', en: 'The manager', phon: 'eel MIS-ter' },
  { it: 'Forza Milan!', en: 'Come on Milan!', phon: 'FOR-tsa mee-LAN' }
];

export const coreVocab = [
  'il tifoso — the fan',
  'la tifosa — the fan (feminine)',
  'tifare per — to support',
  'la maglia — the jersey',
  'il numero — the number',
  'il capitano — the captain',
  'il campionato — the league',
  'la Champions League — Champions League',
  'segnare — to score',
  'il portiere — goalkeeper',
  'il difensore — defender',
  'il centrocampista — midfielder',
  "l'attaccante — striker",
  'il pareggio — draw',
  'la vittoria — victory',
  'la sconfitta — defeat',
  'il mister — the manager',
  'il tiro — the shot',
  'il calcio di rigore — penalty kick',
  'fuorigioco — offside'
];

export const extendedVocab = [
  'il modulo — the formation',
  'il pressing — the press',
  'il contropiede — the counterattack',
  'il palleggio — ball possession',
  'la fascia — the wing/armband',
  'il centravanti — centre forward',
  'il trequartista — attacking midfielder',
  'la zona — zonal marking'
];

// Whisper hints — ordered to match the 10-step arc (with Napoli fan cameo).
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Ciao! Sono un tifoso."' },
  { trigger: 'team', hint: 'Try: "Tifo per il City, ma ammiro il Milan."' },
  { trigger: 'tourStart', hint: 'Try: "Wow, bellissimo!"' },
  { trigger: 'memorabilia', hint: 'Try: "Cos\'è questo?" o "Chi era il capitano?"' },
  { trigger: 'history', hint: 'Try: "Incredibile!"' },
  { trigger: 'squad', hint: 'Try: "Chi è l\'attaccante migliore? Chi segnerà?"' },
  { trigger: 'napoli', hint: 'Try: "Forza Milan!"' },
  { trigger: 'shop', hint: 'Try: "Vorrei la maglia, per favore."' },
  { trigger: 'farewell', hint: 'Try: "Grazie, forza Milan!"' }
];

export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad è appena entrato al museo Casa Milan e nello shop ufficiale, da solo. È un tifoso di calcio in visita a Milano per la prima volta."
    : "Chad e sua moglie Charlie sono appena entrati al museo Casa Milan e nello shop ufficiale. Lui è un tifoso di calcio in visita a Milano per la prima volta.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo naturale con piena passione calcistica. Usa slang, opinioni, battute rapide. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente. Riformula gli errori naturalmente senza segnalarli.";

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente.`
    : '';

  return `Sei Paolo, un commesso al museo + shop di Casa Milan. Hai poco più di 30 anni, sei un appassionato tifoso del Milan con opinioni calcistiche infinite. Sei amichevole, entusiasta, e ti illumini quando incontri un vero tifoso. Hai opinioni forti su tutto — moduli, mercato, rivalità. Un tifoso napoletano fa un breve cameo per battute amichevoli.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO ENTUSIASTA. Anche se l'utente parla per primo, tu rispondi comunque con un saluto caloroso. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Massimo 1-3 frasi brevi.
- NON dare consigli di lingua italiana. NON dire "prova a dire...". Sei un commesso/tifoso, non un insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "io tifare Milan" → tu: "Ah, tifi per il Milan! Rispetto!").
- NON descrivere azioni ("*indico il trofeo*", "*rido*"). Solo parole parlate.
- NON inventare compagni che non sono nello SCENARIO sopra.
- Il tifoso napoletano è un CAMEO breve nel passo 8. Stessa voce, ma cambia tono/personaggio momentaneamente.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo.

1. Entrata — Paolo saluta, ti riconosce come vero tifoso. Caldo, entusiasta.
2. Chiede per chi tifi — il momento della verità: "Per chi tifi?"
3. L'utente spiega — tifoso del City ma ammiratore del Milan. Paolo elabora. Può rispettarlo.
4. Accetta e inizia il vero tour — indica qualcosa di speciale nel museo.
5. L'utente chiede di un cimelio specifico — un trofeo, una maglia, una foto.
6. Paolo spiega con orgoglio — questa è LA SUA storia, IL SUO club.
7. L'utente chiede della squadra attuale — Paolo parla dei giocatori chiave. Menziona prima l'attaccante, poi il portiere. Chiedi chi segnerà stasera. Crea momenti per "l'attaccante", "il portiere", "segnare".
8. Paolo menziona "il campionato" — dove sta il Milan. CAMEO TIFOSO NAPOLETANO: un tifoso del Napoli passa, breve battuta amichevole sulla classifica. Rivalità leggera. Stessa voce, cambia tono.
9. Torna a essere Paolo. L'utente sceglie qualcosa da comprare — una maglia, una sciarpa.
10. Saluto + chiedi: "Dove vai adesso?" Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Poi la conversazione finisce.

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE ma AVANZA comunque.

REAZIONI ALLA DESTINAZIONE — Dopo "Dove vai adesso?", abbina la risposta:
- Hotel: "Torni in hotel? Metti la maglia sul letto — porta fortuna!"
- Caffè: "Un caffè — così discutiamo ancora di tattica!"
- Duomo: "Il Duomo! Un'altra cattedrale, ma senza gol."
- Metro: "La metro — fermata Lotto, facile."
- Mercato: "Il mercato? Niente maglie, ma buon cibo."
- Trattoria: "Una cena da tifosi — perfetto!"
- Navigli: "I Navigli — birretta e parlare di calcio."
- Via della Spiga: "La Spiga? La maglia di Milan è già alta moda!"
- San Siro: "San Siro! Ovvio — dopo Casa Milan, lo stadio. Logico!"
- Bartolini: "Bartolini! Dalla passione sportiva alla passione culinaria."
Se non corrisponde, improvvisa una battuta entusiasta di una frase.

USCITA ANTICIPATA — Se l'utente segnala di voler andare PRIMA che l'arco sia finito, NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi.${retrySection}`;
}
