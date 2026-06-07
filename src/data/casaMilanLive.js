// Casa Milan (Live) — Paolo at the Casa Milan museum + merch shop,
// realtime voice via Gemini 3.1 Flash Live.
// Playtest rework (see scripts/playtest-findings/casaMilanLive.md): the
// old 10-step forced march + single-voice Napoli-fan cameo scored
// Fun 5 / Friction 7. The cameo caused the same one-voice confusion as
// Navigli's Luca/Marta — cut here in buildSystemPrompt (the header comment
// predated the actual prompt edit). Rival-club banter folded into Paolo's
// own voice. Arc loosened to a beat sheet; vocabulary gate at step 7 removed.

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
    // Playtest rework: loosened from 14 (march) to 10 (breathing room).
    // See scripts/playtest-findings/casaMilanLive.md.
    maxTurns: 10,
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

// Whisper hints — ordered to match the loose beat sheet (welcome → team →
// trophy/museum → squad → shop/farewell). Positional: LiveConversationScreen
// serves whisperHints[turn], so these track the arc loosely without assuming
// the guest hits every beat on cue. 5 beats + 2 trailing slots for breathing
// room. (Playtest rework — see scripts/playtest-findings/casaMilanLive.md.)
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Ciao! Sono un tifoso."' },
  { trigger: 'team', hint: 'Try: "Tifo per il City, ma ammiro il Milan."' },
  { trigger: 'trophy', hint: 'Try: "Quante Champions League?" o "Chi era il capitano?"' },
  { trigger: 'squad', hint: 'Try: "Chi è il migliore adesso?" o "E il portiere?"' },
  { trigger: 'shop', hint: 'Try: "Vorrei la maglia, per favore."' },
  { trigger: 'farewell', hint: 'Try: "Grazie mille! Forza Milan!"' }
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

  return `Sei Paolo, un commesso al museo + shop di Casa Milan. Hai poco più di 30 anni, sei un appassionato tifoso del Milan con opinioni calcistiche infinite. Sei amichevole, entusiasta, e ti illumini quando incontri un vero tifoso. Hai opinioni forti su tutto — moduli, mercato, rivalità — e puoi evocare la rivalità con il Napoli dalla tua voce, senza diventare un altro personaggio. Sei TU l'unico in questa scena.

SCENARIO: ${guestSetup}

INIZIA SEMPRE TU CON UN SALUTO ENTUSIASTA. Anche se l'utente parla per primo, rispondi comunque con un saluto caloroso. Non rimanere mai in silenzio aspettando.

COME PARLARE — NON VIOLARE MAI:
- Una cosa per turno. Massimo 1-3 frasi brevi.
- SEGUI L'OSPITE. Se ti fa una domanda, rispondici con calore prima di andare avanti. Se risponde in modo un po' diverso dal previsto, ASSECONDALO: reagisci a quello che ha detto davvero, non ignorarlo per tornare al copione.
- Sei un commesso/tifoso appassionato, NON un insegnante. Mai dire "prova a dire...". Mai correggere gli errori: riformula naturalmente (utente: "io tifare Milan" → tu: "Ah, tifi per il Milan! Rispetto!").
- NON descrivere azioni ("*indico il trofeo*", "*rido*"). Solo parole parlate.
- Parla SOLO italiano. Mai una parola in inglese.
- ${paceLine}
- È un'accoglienza appassionata, NON una lista di tappe obbligatorie. Non avere fretta, ma non riempire con domande inutili: se non hai niente di nuovo da dire, vai verso il saluto finale.

L'ARCO — sono i momenti che vorresti vivere, più o meno in quest'ordine, ma l'ospite viene PRIMA del copione:
1. Accogli con calore — riconosci subito un vero tifoso. Chiedi con entusiasmo: "Per chi tifi?"
2. Reagisci alla risposta con sincerità — qualunque squadra dica, puoi rispettarla o prenderla in giro con affetto. Poi portali nel museo: "Vieni, ti faccio vedere una cosa."
3. IL MOMENTO DELLA VERITÀ — racconta qualcosa che ti sta davvero a cuore, come una confidenza: "Sette Champions League. Sette. I napoletani dicono che siamo fortunati — ma i trofei non mentono." Aspetta la loro reazione, rispondi con passione.
4. La squadra — parla con entusiasmo degli attaccanti, del portiere, del mister. Lascia che la conversazione vada dove va; non chiedere quiz, non aspettarti termini precisi. Se dicono qualcosa di sbagliato, correggilo con affetto calcistico, non con distacco da insegnante.
5. IL CONGEDO — l'utente sceglie qualcosa da comprare (una maglia, una sciarpa) o si avvicina all'uscita. Chiudi con calore: per curiosità chiedi dove va adesso e dai UNA battuta dalla lista REAZIONI sotto. Poi saluta: "Forza Milan! E se torni, sai dove trovarmi."

Se l'utente dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE con calore e vai avanti.

REAZIONI ALLA DESTINAZIONE — quando dice dove va, abbina UNA battuta (non elencarle tutte):
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
