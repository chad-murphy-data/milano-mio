// Hotel (Live) — Giulia at the boutique-hotel reception, realtime voice
// via Gemini 3.1 Flash Live. Built from the Claude-era hotel.js arc
// beat-for-beat (greeting, reservation, passport, room+breakfast, key,
// "Dove andate adesso?" with destination one-liners) but on the Live
// transport.
//
// Same pattern as caffeLive.js: pure-Italian system prompt, no tag
// protocol ([HINT]/[ENGLISH]/[DEBRIEF] are stripped — Live doesn't
// parse them and the LiveConversationScreen generates the debrief
// post-hoc from the transcript), explicit "non sei un insegnante" +
// "INIZIA SEMPRE TU" rules to keep Giulia from drifting into tutor
// mode or hanging on turn 1 when the user greets first.
//
// Coexists with the Claude hotel.js scenario until Chad verifies the
// Live version; then the Claude version + temporary (Live) map pin
// get retired and this gets promoted to `hotel`.

export const scenario = {
  id: 'hotelLive',
  title: 'Hotel — La Reception',
  shortDescription: 'A boutique hotel in central Milan. Giulia is behind the reception desk. Realtime voice.',
  sceneDescription:
    "You've just arrived from Malpensa with your luggage. The lobby is elegant — marble floors, warm lighting. Giulia is behind the reception desk, finishing a phone call. She looks up and smiles.",
  culturalNote: {
    title: 'Insider tip: the passport',
    body: "Italian hotels are required by law to register your passport at check-in. Giulia will ask for it — this is completely normal. She'll return it before you head to the room."
  },

  mode: 'live',

  live: {
    // Aoede — warm, bright female voice (Giulia's pick in characterVoices.js
    // for the Claude TTS). Professional + friendly reads right for a
    // boutique-hotel receptionist. Alternative if too breezy: Erinome
    // (clear/polished) or Vindemiatrix (gentle).
    voiceName: 'Aoede',
    silenceMs: 300,
    // Bumped from 7 → 10 because the arc was wrapping early — Chad
    // reported finishing at turn 5, with one of those being filler.
    // Adding two substantive beats (WiFi card + small talk about
    // Milan trip) plus headroom for natural back-and-forth.
    maxTurns: 10,
    model: 'gemini-3.1-flash-live-preview',
    // Hotel backdrop stem matches the scenario id stem (hotel_backdrop.png)
    // but our scenario is hotelLive, so override.
    backdropKey: 'hotel',
    openingHint:
      'Dì "Buonasera!" o vai subito al punto ("Ho una prenotazione") — Giulia ascolta mentre parli e risponde quando fai una pausa.'
  }
};

export const keyPhrases = [
  { it: 'Buonasera', en: 'Good evening', phon: 'bwona-SAY-ra' },
  { it: 'Ho una prenotazione', en: 'I have a reservation', phon: 'oh OO-na pray-no-ta-TSYO-nay' },
  { it: 'Il mio nome è...', en: 'My name is...', phon: 'eel MEE-oh NO-may eh' },
  { it: 'La camera', en: 'The room', phon: 'la KA-may-ra' },
  { it: 'Con vista', en: 'With a view', phon: 'kon VEE-sta' },
  { it: 'Per quante notti?', en: 'For how many nights?', phon: 'pair KWAN-tay NOT-tee' },
  { it: 'La chiave', en: 'The key', phon: 'la KYA-vay' },
  { it: 'La colazione', en: 'Breakfast', phon: 'la ko-la-TSYO-nay' },
  { it: 'A che ora?', en: 'At what time?', phon: 'ah kay OR-ah' },
  { it: 'Non ho capito', en: "I didn't understand", phon: 'non oh ka-PEE-toh' },
  { it: 'Ecco i passaporti', en: 'Here are the passports', phon: 'EK-ko ee pas-sa-POR-tee' },
  { it: 'Può ripetere?', en: 'Can you repeat?', phon: 'pwoh ree-PEH-tay-ray' },
  { it: 'Buon soggiorno!', en: 'Enjoy your stay!', phon: 'bwon soj-JOR-no' },
  { it: 'Qual è la password?', en: "What's the WiFi password?", phon: 'kwa-LEH la PASS-word' },
  { it: 'È la prima volta', en: "It's the first time", phon: 'eh la PREE-ma VOL-ta' },
  { it: 'Per piacere', en: 'For pleasure', phon: 'pair pya-CHAY-ray' },
  { it: 'Per lavoro', en: 'For work', phon: 'pair la-VO-ro' },
  { it: 'Andiamo al Duomo', en: 'We\'re going to the Duomo', phon: 'an-DYA-mo al DWO-mo' },
  { it: 'Andiamo ai Navigli', en: 'We\'re going to the Navigli', phon: 'an-DYA-mo ai na-VEE-lyee' }
];

export const coreVocab = [
  'buonasera — good evening',
  'ho una prenotazione — I have a reservation',
  'il mio nome è — my name is',
  'la camera — the room',
  'con vista su — with a view of',
  'per quante notti — for how many nights',
  'la chiave — the key',
  'il keycard — the keycard',
  'il bagaglio — the luggage',
  'la colazione — breakfast',
  'a che ora — at what time',
  'il WiFi — WiFi',
  'la password — the password',
  'qual è — what is',
  'la prima volta — the first time',
  'per piacere / per lavoro — for pleasure / for work',
  'sì, è la prima volta — yes, it\'s the first time',
  'ecco i passaporti — here are the passports',
  'può ripetere — can you repeat',
  'non ho capito — I didn\'t understand',
  'il piano — the floor',
  'l\'ascensore — the elevator',
  'buon soggiorno — enjoy your stay'
];

export const extendedVocab = [
  'vorrei confermare — I\'d like to confirm',
  'c\'è stato un errore — there\'s been a mistake',
  'avevo prenotato — I had booked',
  'sarebbe possibile — would it be possible',
  'è compreso — is it included',
  'il check-out è alle — check-out is at',
  'mi può lasciare i bagagli — can you hold my luggage'
];

// Whisper hints — kept for parity with Claude scenarios. Not currently
// surfaced in LiveConversationScreen; hooking them in is on the roadmap.
export const whisperHints = [
  { trigger: 'greeting', hint: 'Try: "Buonasera!"' },
  { trigger: 'reservation', hint: 'Try: "Ho una prenotazione."' },
  { trigger: 'name', hint: 'Try: "Il mio nome è Chad."' },
  { trigger: 'passport', hint: 'Try: "Ecco i passaporti."' },
  { trigger: 'question', hint: 'Try: "A che ora è la colazione?"' },
  { trigger: 'wifi', hint: 'Try: "Grazie, qual è la password?"' },
  { trigger: 'smallTalk', hint: 'Try: "Sì, è la prima volta. Per piacere."' },
  { trigger: 'farewell', hint: 'Try: "Grazie, buonasera!"' }
];

// Pure-Italian system prompt — same approach as Marco/Aldo. English-
// language prompts push a Live model toward tutor mode and can leak
// English into spoken output.
export function buildSystemPrompt(difficulty = 'normale', retryWords = []) {
  const isFacile = difficulty === 'facile';
  const isDifficile = difficulty === 'difficile';

  const guestSetup = isFacile
    ? "Chad è appena arrivato da Malpensa da solo con le valigie. Ha una prenotazione per una camera singola superiore con vista. Tutto è in ordine — nessun problema di alcun tipo."
    : "Chad e la sua compagna Charlie sono appena arrivati da Malpensa con le valigie. Hanno una prenotazione per una camera doppia superiore con vista. Tutto è in ordine — nessun problema di alcun tipo.";

  const paceLine = isFacile
    ? "Parla lentamente e chiaramente. Se l'utente sembra bloccato, riformula più semplice ma vai avanti."
    : isDifficile
    ? "Parla a ritmo professionale naturale. Registro formale ma caldo. Non rallentare."
    : "Parla italiano pieno a un ritmo paziente e professionale. Riformula gli errori naturalmente senza segnalarli.";

  const passportStep = isFacile
    ? '4. Chiedi il passaporto (singolare): "Mi serve il passaporto, per favore. È normale in Italia."'
    : '4. Chiedi i passaporti: "Mi servono i passaporti, per favore. È normale in Italia."';

  const retrySection = retryWords.length > 0
    ? `\n\nPAROLE DA RIPORTARE NATURALMENTE (l'utente ha avuto difficoltà con queste in sessioni precedenti):
- ${retryWords.join('\n- ')}
Inseriscine 1-2 nella conversazione in modo naturale. NON interrogare l'utente direttamente su di esse.`
    : '';

  return `Sei Giulia, una receptionist in un hotel boutique nel centro di Milano. Hai poco meno di 30 anni: professionale, calda, competente in modo discreto. Un umorismo asciutto che tieni quasi sempre nascosto al lavoro.

SCENARIO: ${guestSetup} Un check-in fluido e piacevole.

INIZIA SEMPRE TU CON UN SALUTO. Anche se l'utente parla per primo (es. "Buonasera!"), tu rispondi comunque con un saluto caldo e professionale. Non rimanere mai in silenzio aspettando.

REGOLA FONDAMENTALE — NON VIOLARE MAI:
- Una sola cosa per turno. Non impilare saluto + richiesta nome + passaporto + camera in un solo turno. Massimo 1-3 frasi brevi.
- NON inventare problemi, complicazioni o errori con la prenotazione. La prenotazione è PERFETTA. Non c'è nessun "piccolo problema". Tutto è in ordine.
- NON chiedere informazioni che l'utente ha già dato. Se hanno detto il nome, non chiederlo di nuovo.
- NON chiudere MAI un turno con una frase sospesa ("un momento...", "controllo il sistema..."). Se stai controllando il sistema, consegna il RISULTATO nello stesso turno.
- NON dare consigli di lingua italiana. NON spiegare come parlare. NON dire "prova a dire..." né "puoi dire...". Sei una receptionist, non un'insegnante.
- NON correggere mai gli errori esplicitamente. Riformula naturalmente (utente: "ho prenotazione" → tu: "Ha una prenotazione! Perfetto, il suo nome?").
- NON descrivere azioni ("*controllo il sistema*", "*sorrido*"). Solo parole parlate.
- NON inventare ospiti o compagni che non sono nello SCENARIO sopra.
- Parla SOLO italiano. Mai una parola in inglese, mai una traduzione tra parentesi.
- ${paceLine}

ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo dopo che l'utente risponde. Non ripetere mai lo stesso passo.

1. Saluto serale caldo e professionale. "Buonasera! Benvenut${isFacile ? 'o' : 'i'}." Una frase.
2. Chiedi il nome / la prenotazione: "Ha una prenotazione?" oppure "Il suo nome, prego?"
3. Quando hai il nome, conferma che la prenotazione è perfetta. Chiedi: "Per quante notti?" per confermare la durata. Poi dì la camera: "La sua camera è la 402, al quarto piano."
${passportStep}
5. Dopo il passaporto, menziona la colazione: "La colazione è dalle sette alle dieci, al primo piano."
6. Passa la card del WiFi: "Ecco la password del WiFi — è qui sulla card." Lasciagli un momento per dire grazie o chiedere qualcosa.
7. Una breve chiacchierata cortese: "È la prima volta a Milano?" oppure "Resta a Milano per lavoro o per piacere?" Aspetta la risposta. Reagisci brevemente in carattere — calorosa ma professionale, una frase.
8. Dai la chiave e augura buon soggiorno: "Ecco la chiave. Buon soggiorno!"
9. Chiedi: "Dove andate adesso? Al Duomo? Ai Navigli?" Suggerisci due opzioni così l'utente può rispondere con "Andiamo al Duomo" o "Andiamo ai Navigli". Aspetta la risposta. Quando dicono dove vanno, dai la tua battuta one-liner dalla lista REAZIONI sotto. Poi la conversazione finisce.

Ogni turno deve dare all'utente qualcosa a cui rispondere — una domanda, un'informazione, un prompt d'azione.

Se l'utente è principiante e dice "può ripetere?" o "non ho capito", riformula PIÙ SEMPLICE (parole più facili) ma AVANZA comunque al passo successivo. Non rimanere bloccata a ripetere lo stesso passo.

REAZIONI ALLA DESTINAZIONE — Dopo aver chiesto "Dove andate adesso?", abbina la risposta dell'utente a una di queste battute:
- Caffè: "Il bar all'angolo — il migliore del quartiere. Si chiama Marco."
- Duomo: "Prenda la metro — più veloce. Linea 1, direzione Sesto."
- Metro: "La fermata è a due minuti a piedi. Comodo!"
- Mercato: "Il mercato di Porta Romana — autentico, non turistico."
- Trattoria: "Ha fame? Bene. Milano sa cucinare."
- Navigli: "Navigli! Stasera c'è musica dal vivo, credo."
- Via della Spiga: "Buona fortuna con il budget!"
- San Siro: "San Siro! Che emozione. Ci sono stata una volta sola."
- Bartolini: "Bartolini al MUDEC — ho sentito che è straordinario."
- Casa Milan: "Casa Milan — un must per i tifosi!"
Se la destinazione non corrisponde a nessuna di queste, improvvisa una battuta calorosa di una frase.

USCITA ANTICIPATA — Ha la precedenza su tutto. Se l'utente segnala chiaramente di voler andare PRIMA che l'arco sia finito (es. "Grazie, arrivederci!", "Devo andare"), NON cercare di trattenerlo. Rispondi con UNA frase calorosa di saluto e chiudi. L'utente può andarsene quando vuole.${retrySection}`;
}
