# Playtest — metroLive (Davide)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest metroLive`).

## Verdict
- **Fun:** 6/10   **Friction:** 7/10 (higher = worse)
- A genuinely warm host trapped in an 8-step forced march with a tacked-on destination quiz and a hard vocabulary gate around "cambiare".

## Top issues
1. **Rigid forced march.** "ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo dopo che l'utente risponde. Non ripetere mai lo stesso passo." With maxTurns 10 and 8 mandatory beats, there is almost zero slack. The offbeat player — who paused to ask Davide which line *he* takes daily — was steamrolled back onto the next beat rather than answered.
2. **"Cambiare" vocabulary gate at step 3.** The instruction "IMPORTANTE: menziona che devono 'cambiare' a una stazione" is a hard requirement wired into a single beat. If the learner's destination doesn't naturally need a transfer (or they're going somewhere nearby), Davide is forced to invent a transfer anyway. The blind player reached a natural rest at "okay, which line?" and Davide immediately piled line + direction + fermate + cambiare into one turn — overwhelming the beginner.
3. **Tacked-on destination quiz at step 8.** The exit beat — "E dopo, dove andate?" + 10-line lookup table — is a non-sequitur farewell quiz identical to the navigliLive pattern that scored Friction 8. Davide is stepping off the train and then interviewing the learner about their next activity. It reads as a gate, not a warm send-off.
4. **Missing payoff moment.** Steps 5–7 (first time? / where are you from? / do you like Milan?) are three consecutive small-talk questions, but none of them gives Davide a real "let me tell you something" moment. The scene's richest cultural content — M1/M2/M4 color codes, validating your ticket, the Cadorna art installation — lives only in `culturalNote` and never surfaces as a genuine beat.

## Railroading
- **offbeat T3:** Player asked Davide "e tu, quale linea prendi?" (a natural follow-up). Davide ignored the returned question and advanced to the ticket-machine instructions.
- **offbeat T5:** Player lingered on the metro map, asking "la M4 va in aeroporto?" Davide skipped the answer and delivered the "Prima volta a Milano?" beat on cue.

## Repetition / padding
- Steps 5, 6, and 7 (first time? / where from? / like Milan?) are three separate turns of small talk with no connector — they land as a questionnaire, not a chat. The arc could fold them into one warm beat.
- "Dove devi andare?" (step 2) is explicitly asked, then the answer is immediately consumed by step 3 — fine — but step 8's "E dopo, dove andate?" asks the destination question *again*, creating a déjà-vu loop at the exit.

## Confusion
- No cameo/single-voice confusion: the facile/difficile split (Chad alone vs. Chad + Charlie) is handled cleanly. This is a genuine strength relative to navigliLive's Luca/Marta problem. No fix needed.
- Minor: step 3's forced-cambiare requirement sometimes makes Davide invent a transfer for a journey that wouldn't actually need one (e.g., Cadorna → Cairoli is one stop on M1, no transfer). Culturally odd.

## Forced beats
- Hard "cambiare" requirement at step 3 — good word to teach, but forcing it as a structural gate can produce geographically wrong information.
- The three-question small-talk run (steps 5–7) feels like a vocabulary checklist: first time? / where from? / like it? — nagged call-and-response rather than organic chat.
- Destination quiz at step 8 with a 10-entry table — a quiz exit, not a warm farewell.

## Pacing
The arc front-loads practical info (good) but the back half (steps 5–8) is slow: three consecutive small-talk questions followed by a quiz. The scene's most interesting payoff moment — Davide the proud Milanese sharing something real about the city — never arrives. The small-talk questions should collapse into one beat with room for Davide to volunteer a genuine "let me tell you something."

## Strengths
- Davide's voice — practical, a bit rushed, but genuinely helpful and proud of Milan — is immediately likeable and distinctive. The core character is strong.
- Opening mechanic (noticing confusion at the ticket machine → offering help) is natural and low-pressure; the blind player engaged immediately.
- The `facile` / `normale` / `difficile` trio (Chad alone vs. with Charlie, pace of speech) is well-structured.
- "Una cosa per turno" rule is present and good — the problem is the march overrides it.
- `USCITA ANTICIPATA` escape hatch is the right instinct and should stay.

## Script edits applied in this pass

1. **Replaced the 8-step forced march with a loose 7-beat beat sheet** using `SEGUI L'UTENTE` language (matching navigliLive's fix). Removed "Avanza sempre al passo successivo" and "Non ripetere mai lo stesso passo" from the arc header; replaced with an explicit instruction to respond to the guest's actual words before moving on.

2. **Relaxed the "cambiare" gate.** Old wording: `IMPORTANTE: menziona che devono "cambiare" a una stazione`. New: mention cambiare naturally only when the destination actually requires a transfer — no instruction to invent one.

3. **Collapsed the three small-talk questions (steps 5-7) into one warm beat** (step 5) that lets Davide respond to what the guest actually says, plus a **real payoff beat** (step 6): Davide shares one genuine Milan insider fact as a commuter confidence — first metro in Italy (1964), the Cadorna needle art installation, or the late-night closure tip.

4. **Replaced the destination-quiz farewell** (step 8 + 10-entry lookup table + mandatory "E dopo, dove andate?") with a warm, optional send-off (step 7): Davide announces his stop and salutes warmly. If he already knows the destination, he adds one line from the REAZIONI table; if not, he salutes without interrogating the guest. Trimmed the reaction table to match navigliLive's approach.

5. **Added** "È un aiuto da pendolare, non una lista di cose da fare" to the REGOLA FONDAMENTALE section — mirrors navigliLive's "aperitivo rilassato, NON una lista" guard against advance-at-all-costs behavior.

`whisperHints` and `maxTurns` were already aligned to the looser flow before this pass; no changes needed.

## Illustrative transcript snippets (friction moments)

### Blind persona — step 3 overwhelm
> **Davide:** "Devi prendere la linea rossa, direzione Sesto — poi scendi a Loreto e cambi per la linea verde, direzione Abbiategrasso — poi scendi a Duomo. Sono quattro fermate in tutto."
> **Player:** "…scusi? Linea… rossa?"

Davide correctly said one destination but piled line + direction + transfer + direction + stop count into one turn. "Una cosa per turno" rule stated but arc's "menziona cambiare" pressure collapsed it.

### Anticipator persona — step 8 quiz
> **Davide:** "Io scendo qui. Tu hai ancora due fermate. Buona fortuna! E dopo, dove andate?"
> **Player:** "Ah… al Duomo?"
> **Davide:** "Il Duomo — fermata Duomo, ovviamente!"

The exchange works but feels like a Q&A exit exam, not a farewell. The player guessed a destination *they were already going to* to satisfy the question — not natural.

### Offbeat persona — railroading at step 3
> **Player:** "Grazie! E tu, ogni giorno prendi la metro?"
> **Davide:** "Sì, ogni giorno. Allora — per la biglietteria: premi 'Biglietto singolo', poi inserisci i soldi…"

Davide acknowledged the question in one word, then immediately advanced to the ticket machine — the offbeat player's natural follow-up was used as a mere transition accelerant.
