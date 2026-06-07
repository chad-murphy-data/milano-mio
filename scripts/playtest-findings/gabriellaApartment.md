# Playtest — gabriellaApartment (Gabriella)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest gabriellaApartment`).

## Verdict
- **Fun:** 6/10   **Friction:** 6/10 (higher = worse)
- A genuinely warm tutor scene held back by one railroading phrase in casual
  mode and a "one word per turn" march in review mode that overrides the
  otherwise-good "follow the guest" note.

## Top issues

1. **"UN PASSO PER TURNO. Avanza al passo successivo" in casual mode.**
   This is the exact line that broke navigliLive. It tells the LLM to step
   mechanically through the numbered arc after every single reply, so when
   the offbeat player deviates the LLM advances instead of following.
   Gabriella's casual-mode arc is only 6 steps for a 14-turn max — fine as
   a loose beat sheet, but the march instruction turns it rigid.

2. **Review mode: "una per turno" forces a word-drill march.**
   The arc says "Lavora attraverso 4-6 parole dalla lista, una per turno."
   The offbeat player who asks about a book on the table or follows up on
   something Gabriella said gets a one-word acknowledgment then the next
   vocab word queued up, because the march instruction outweighs the buried
   "puoi andare fuori dal copione" note three screens later.

3. **whisperHints has only 3 entries for maxTurns 14.**
   Positional clamping (whisperHints[turn]) means the farewell hint appears
   from turn 3 onward — nudging "Grazie, a presto!" while the review is
   still warming up. The hint set should cover more of the arc's beats.

## Railroading (offbeat transcript — review mode, friction moment)

> **Gabriella:** "Allora — *scontrino*. Ieri al supermercato ho perso lo
> scontrino e mi sono dovuta rifare la fila. Lo usi anche tu?"
>
> **Chad (offbeat):** "Sì! Ma Gabriella — questo libro sul tavolo, di cosa
> parla?"
>
> **Gabriella (railroaded):** "Ah, un libro bellissimo! Allora, la prossima
> parola — *in attesa*. Immagina di essere all'aeroporto..."

She gave the book a token "Ah bello" and stepped to the next word. The march
instruction won over her follow-the-guest character.

## Repetition / padding
- None significant. The three formats (A/B/C) vary the review well.
- The check-in at step 9 ("Vuoi continuare?") is well-placed and not forced.

## Confusion (blind transcript — casual mode)

> **Gabriella:** "Ciao Chad! Caffè è pronto. Siediti."
>
> **Chad (blind):** "Grazie! Sono stanco oggi."
>
> **Gabriella (step 3, then hard pivot to step 4):** "Capisco, ti capisce
> Milano. Sai, ho qualche parola da rivedere con te quando vorrai — aspetta
> di averne una decina..."
>
> **Chad:** "Oh — cosa stai leggendo? Quel libro..."

She had been told to mention the notebook at step 4 and did so on cue, even
though the player was clearly opening a different thread. The march pulled her
to the scripted notebook mention before engaging the book question. The blind
player found this abrupt.

## Forced beats
- Casual mode step 4 notebook mention: inserted even when the player has
  opened an off-script conversational thread (because "Avanza al passo
  successivo" is an instruction, not a suggestion).
- No vocab-gate nagging equivalent to navigliLive's "crepi!" — Gabriella
  handles wrong/missing answers gracefully. This is a genuine strength.

## Pacing
- Review mode pacing is good when the march is relaxed; the check-in at
  turn ~9 is a natural pause.
- Casual mode at 14 maxTurns with a 6-step arc is fine; the march makes
  it feel rushed because steps get consumed too quickly.

## Strengths
- The three review formats (in-sentence / productive scenario / recall cue)
  are well-designed and do vary the experience.
- The sourceSentence callback ("Ti ricordi quando Marco ha detto...") is a
  lovely moment that grounds the vocab in real memory.
- Gabriella's voice — warm, slightly playful, genuinely proud — is exactly
  right for this role.
- The casual-mode branching logic (queue size 0 vs. small-but-below-threshold)
  is smart and avoids false lesson pressure.
- The check-in ("Vuoi continuare?") gives the player real agency.

## Script changes applied (this pass)

1. **Casual mode:** Replace `UN PASSO PER TURNO. Avanza al passo successivo
   dopo che Chad risponde.` with a loose beat-sheet framing: "questi sono i
   momenti che ti piacerebbe vivere, più o meno in quest'ordine, ma l'ospite
   viene PRIMA del copione." Mirrors the navigliLive fix exactly.

2. **Review mode:** Replace "una per turno" march language with a flexible
   instruction: "Lavora verso 4-6 parole, ma SEGUI CHAD — se apre un filo
   diverso, assecondalo prima di tornare al ripasso." The pace is now driven
   by the conversation, not the list.

3. **whisperHints:** Expand from 3 to 6 entries to cover the full 14-turn
   arc: greeting → coffee/settle → review begins → mid-review check → check-in
   → farewell. The farewell hint now appears late, not immediately.
