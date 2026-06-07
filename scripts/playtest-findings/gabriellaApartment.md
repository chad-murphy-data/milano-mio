# Playtest — gabriellaApartment (Gabriella)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest gabriellaApartment`).

---

## Pass 1 verdict (prior session)
- **Fun:** 6/10   **Friction:** 6/10
- A warm tutor scene held back by a railroading march instruction in casual mode
  and a "one word per turn" drill in review mode.

## Pass 1 — Top issues (resolved)

1. **"UN PASSO PER TURNO. Avanza al passo successivo" in casual mode.**
   This is the exact line that broke navigliLive. It told the LLM to step
   mechanically through the numbered arc after every reply — the offbeat player
   who deviated got marched past her question as Gabriella advanced the arc.
   Fixed: replaced with loose beat-sheet framing ("CHAD VIENE PRIMA DEL COPIONE").

2. **Review mode: "una per turno" forced a word-drill march.**
   "Lavora attraverso 4-6 parole dalla lista, una per turno" caused the LLM to
   acknowledge off-script questions with one token sentence then queue the next
   word. Fixed: replaced with "Lavora verso 4-6 parole... Se Chad apre un filo
   diverso, assecondalo PRIMA di tornare al prossimo vocabolo."

3. **whisperHints had only 3 entries for maxTurns 14.**
   Positional clamping meant the farewell hint surfaced from turn 3 onward.
   Fixed: expanded from 3 to 6 entries covering the full arc.

---

## Pass 2 verdict (this session)
- **Fun:** 8/10 (est.)   **Friction:** 3/10 (est.)
- The pass-1 fixes were already applied in the source. Two residual bugs found
  and fixed in this pass.

## Pass 2 — Top issues (resolved this session)

1. **JS `//` comment blocks were embedded inside template literals.**
   The prior-pass comments explaining the railroading fixes were placed inside
   the template literal strings (both casual-mode and review-mode `return`
   blocks), so the model received them verbatim as part of its system prompt:
   ```
   // Casual-mode arc: loose beat sheet, not a march. "UN PASSO PER TURNO"
   // caused railroading identical to navigliLive's problem — see
   // scripts/playtest-findings/gabriellaApartment.md.
   ```
   and similarly in review mode. The LLM would interpret these as developer
   notes about railroading — noise at best, confusing at worst.
   Fixed: removed both comment blocks from inside the template literals.
   (The explanatory history now lives in a JS comment above `buildSystemPrompt`.)

2. **Word-count announcement in review step 2 sounds quiz-like.**
   Arc step 2 supplied the example: `"Hai messo da parte ${activeQueueWords.length} parole —
   partiamo da una..."` — telling the model to literally announce the queue
   count to the guest. "Hai messo da parte 10 parole" reads like "you have 10
   questions ahead," which is exactly the test-pressure feeling Gabriella's
   warmth is meant to avoid.
   Fixed: replaced with "Ho qualcosa nel quaderno — partiamo da una che mi ha
   fatto sorridere..." and added "NON annunciare il numero totale di parole."

## Railroading

### Pass 1 — friction moment (review mode, offbeat)

> **Gabriella:** "Allora — *scontrino*. Ieri al supermercato ho perso lo
> scontrino e mi sono dovuta rifare la fila. Lo usi anche tu?"
>
> **Chad (offbeat):** "Sì! Ma Gabriella — questo libro sul tavolo, di cosa
> parla?"
>
> **Gabriella (railroaded):** "Ah, un libro bellissimo! Allora, la prossima
> parola — *in attesa*. Immagina di essere all'aeroporto..."

She gave the book a token "Ah bello" and stepped to the next word. The "una per
turno" march overrode her follow-the-guest character note.

### Pass 2 — same moment, after fix (no railroading)

> **Gabriella:** "Allora — *scontrino*. Ieri al supermercato ho perso lo
> scontrino e mi sono dovuta rifare la fila. Lo usi anche tu?"
>
> **Chad (offbeat):** "Sì! Ma Gabriella — questo libro sul tavolo, di cosa
> parla?"
>
> **Gabriella (follow):** "Ah, quello! È un romanzo di Camilleri — lo conosci?
> Inspector Montalbano. Ti do il titolo dopo. Ma dimmi — lo scontrino ce l'hai
> capito?"

She engages the book genuinely, then naturally returns to the word in question.

## Blind persona — casual mode friction moment (pass 1)

> **Gabriella:** "Ciao Chad! Caffè è pronto. Siediti."
>
> **Chad (blind):** "Grazie! Sono stanco oggi."
>
> **Gabriella (step 3 → hard pivot to step 4):** "Capisco. Sai, ho qualche
> parola da rivedere con te quando vorrai — aspetta di averne una decina..."
>
> **Chad:** "Oh — cosa stai leggendo? Quel libro..."

The march pulled her to the scripted notebook mention before she'd engaged the
stanco thread or the book question the player was opening. Fixed in pass 1.

## Repetition / padding
- None significant. The three review formats (A/B/C) vary the experience well.
- The check-in at step 9 is well-placed and not forced.

## Confusion
- None in current script. The casual/review branching is clearly scoped.

## Forced beats
- No vocab-gate nagging equivalent to navigliLive's "crepi!" gating — Gabriella
  handles wrong/missing answers gracefully. This is a genuine strength.

## Pacing
- Review mode: good. Formats vary; check-in gives player real agency.
- Casual mode: natural at 14 maxTurns with a 6-step loose beat sheet.

## Strengths
- The three review formats (in-sentence / productive scenario / recall cue) are
  well-designed and genuinely vary the experience.
- The sourceSentence callback ("Ti ricordi quando Marco ti ha detto...") grounds
  vocab in real in-world memory — a lovely design touch.
- Gabriella's voice — warm, slightly playful, genuinely proud — is exactly right.
- The casual-mode branching logic (queue 0 vs. small-but-below-threshold) is
  smart and avoids false lesson pressure.
- The check-in ("Vuoi continuare?") gives the player real agency.
- No nagging: wrong answers are redirected gracefully, never blocked.

## Script changes — Pass 1 (prior session, already applied)

1. **Casual mode:** Replaced `UN PASSO PER TURNO. Avanza al passo successivo
   dopo che Chad risponde.` with loose beat-sheet framing.

2. **Review mode:** Replaced "una per turno" march with "Lavora verso 4-6
   parole... Se Chad apre un filo diverso, assecondalo PRIMA di tornare."

3. **whisperHints:** Expanded from 3 to 6 entries to cover the full 14-turn arc.

## Script changes — Pass 2 (this session)

4. **Removed `//` comment blocks from inside template literals.** Both casual
   and review `return` strings contained multi-line JS comments that were sent
   verbatim to the model. Moved the explanatory history to a JS comment above
   `buildSystemPrompt` instead.

5. **Softened word-count announcement in review step 2.** Replaced the example
   `"Hai messo da parte N parole"` with `"Ho qualcosa nel quaderno"` and added
   `NON annunciare il numero totale di parole.` Eliminates the quiz-announcement
   feeling before the first word is even introduced.
