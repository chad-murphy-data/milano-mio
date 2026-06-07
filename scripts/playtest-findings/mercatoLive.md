# Playtest — mercatoLive (Rosa)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce with `node scripts/playtest.mjs playtest mercatoLive`).

**This file covers TWO passes.** A first pass (Fun 5 / Friction 7) produced
the file-header comment and partial edits now visible in the source. A second
pass (this document) found that the outer wrapper was fixed but the core arc
language was not — the system prompt still says "UN PASSO PER TURNO. Avanza
sempre." and "Insisti." The edits below finish the job.

## Verdict (second pass — pre-edit)
- **Fun:** 6/10   **Friction:** 6/10 (higher = worse)
- A warm host with a great setting, stuck in a forced march that hides inside
  a "loose beat sheet" wrapper. The comments promise flexibility; the arc text
  delivers a drill sergeant.

## Top issues

1. **Forced march still in the arc wording.** The outer wrapper says "loose
   beat sheet" but the system-prompt arc says "UN PASSO PER TURNO. Avanza
   sempre al passo successivo. Non ripetere mai lo stesso passo." — step-gate
   language that overrides any looseness. The offbeat player was silently
   skipped past every unscripted moment.
2. **"Insisti" at the taste-test gate (step 5).** "Assaggi, assaggi! Insisti."
   is the exact crepi-gate pattern flagged in navigliLive. Rosa is instructed
   to badger the learner regardless of whether they already said yes.
3. **No genuine "let me tell you something" payoff.** Rosa has three
   generations of market history — none of it surfaces as a personal moment
   in the arc. The cultural richness lives only in the sidebar.
4. **Destination quiz still a tacked-on final step.** "Dove andate adesso?"
   + 10-entry reaction table as the mandatory *last* numbered step reopens the
   conversation after its natural close (payment). Same pattern as pre-rework
   navigliLive.

## Railroading

**Offbeat T3:** Player asked "Da quanto tempo lavorate qui?" (natural curiosity
about the family stall) → Rosa steamrolled into the "di stagione" explanation
because step 3 must fire.

> **Player:** "Da quanto tempo lavorate qui?" *(warm curiosity)*
> **Rosa (railroaded):** "Questi lampascioni — sono di stagione adesso,
>   solo sei settimane l'anno!"
> *(The personal question was ignored; the step-3 beat fired unchanged.)*

**Offbeat T5 (friction peak — the "Insisti" gate):**

> **Rosa:** "Assaggi, assaggi! È freschissimo!"
> **Player:** "Sì, sembra delizioso — lo prendo!"
> **Rosa (nagged):** "Dai, assaggi davvero! Non si pente, giuro."
> **Player:** *(already said yes — now just confused)* "…Grazie?"

The `Insisti` instruction overrode the player's clear yes. This is the
scene's highest-friction single moment.

## Repetition / padding

- Steps 5 and 6 are conceptually one beat split across two turns: "offer
  taste → insist" and "guest reacts → Rosa glows." No new vocabulary between
  them; compressing to one beat is strictly better.
- Step 8 ("loro rispondono entusiasti — tu ti illumini") is a standalone
  "glow" turn with no new content; same as step 6's glow. Two glow turns in
  four steps is dead weight.

## Confusion

- Rosa is solo — no single-voice multi-character confusion. This is a
  genuine strength; keep it.
- Step 2's "Aspetta che chiedano" (wait for them to ask "Cos'è questo?")
  caused an awkward stall with the blind player, who said "Buono!" and Rosa
  silently waited. Drop the explicit wait; Rosa should offer the curiosity
  hook herself and move on if they don't bite.

## Forced beats

- Step 2: "Aspetta che chiedano" — explicit wait-for-phrase that can stall.
- Step 5: "Insisti" — nagged taste gate.
- Step 6: "Chiedi: 'Ne prende due?'" — leading question engineered to elicit
  a specific vocabulary response.
- Step 10: "Dove andate adesso?" — exit quiz after the natural farewell.

Illustrative anticipator snippet (step 6 gate):

> **Rosa (T6):** "Buono, vero? Ne prende due, allora?"
> **Player:** "Ehm… sì, due, ne prendo due."
> **Rosa:** "Bene!"
> *(Player felt like they were just reading back the script.)*

## Pacing

Steps 1–4 are well-paced: greeting → curiosity → seasonal → weighing.
Steps 5–10 compound: taste-nag, glow, price, glow again, payment, exit quiz.
The back half drags. The two "glow" turns (6, 8) add no vocabulary and stall
forward motion. Step 10 is anticlimactic.

Rosa's missing payoff — three generations of this stall, knowing the farmer,
a secret about what makes produce worth buying — would fix the pacing problem
and give the scene a real emotional peak.

## Strengths

- Rosa's character voice (food-evangelical, speeds up when excited, warm) is
  excellent and should not be touched.
- The core arc skeleton (greeting → curiosity → seasonal → quantity → taste
  → price → pay) maps naturally to real Milanese market behaviour.
- No-English, no-corrections, no-action-descriptions rules are strong.
- Rosa is solo throughout — no single-voice confusion.
- USCITA ANTICIPATA is well handled.
- The destination reaction mechanic is well-motivated (feeds map transition);
  keeping it, just de-quizzing it.
- `coreVocab` and `extendedVocab` are genuinely well-curated.

## Script suggestions (applied in second pass)

- **Replace "UN PASSO PER TURNO" with a true loose beat sheet** — same beats,
  explicit "follow the guest's lead; react to what they actually said; the arc
  is what you'd *love* to happen, not a checklist." Match navigliLive wording.
- **Drop "Insisti" and "Aspetta che chiedano."** Rosa offers the curiosity hook
  and the taste once, warmly; if the guest bites, great; if not, she moves on.
  Never waits, never nags.
- **Add a "let me tell you something" beat:** Rosa shares one inside detail —
  three generations, knowing the farmer, why this product is only good six
  weeks a year — as a genuine confidence, not a quiz.
- **Collapse the double-glow turns (5+6, 7+8)** into Rosa's natural reactions
  within the adjacent beats. Saves two turns of filler.
- **Move "Dove andate?" inside the farewell beat**, not as a separate final
  step, so the destination reaction warms the goodbye rather than reopening a
  closed scene.
- `whisperHints` already match the intended loose arc; no changes needed there.
- `maxTurns` stays 10 — now genuine breathing room, not a countdown.
