# Playtest — bartoliniLive (Alessandro)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest bartoliniLive`).

## Verdict

- **Fun:** 6/10 → **8/10** (estimated after edits)
- **Friction:** 6/10 → 2/10** (estimated after edits; higher = worse)
- Alessandro's formal warmth is the scene's genuine asset and already
  well-preserved from the prior pass. A triple-loaded beat 4, a plural
  pronoun leak in the shared SCENARIO line, and a one-turn-too-late
  insider whisper hint were the residual issues.

## Top issues

1. **Beat 4 is triple-loaded — dish + insider + "Le piace?" in one turn.**
   The arc asks Alessandro to (a) name the dish, (b) deliver the
   insider confidenza, and (c) ask "Le piace?" all in one speech. This
   violates the "MASSIMO 1-2 frasi BREVI per turno" rule in the same
   prompt. In practice the LLM produces a long monologue, then the guest
   hasn't had space to react before the insider detail lands. When the
   guest reacts to the dish first (turn 5), the insider fires as
   Alessandro's next beat anyway — but whisperHints[4] ("Davvero?") has
   already fired on turn 4, a beat too early, pointing at an insider
   that hasn't arrived yet. Splitting beat 4 into two sub-beats
   (dish → guest reacts → insider detail) fixes both the monologue and
   the hint timing.

2. **Plural pronoun leak in the hardcoded SCENARIO line.** The facile
   `guestSetup` correctly uses singular (Chad da solo, "La accompagno"),
   but the immediately following SCENARIO template line — `"tu li accogli,
   li accomodi"` — is hardcoded outside `guestSetup` and stays plural for
   every difficulty. A blind facile player heard Alessandro say "La
   accompagno" then immediately "li accomodi" and assumed a second guest
   had joined.

3. **maxTurns 7 leaves no slack for offbeat play.** With 6 mandatory beats
   and 7 turns, an offbeat player who fumbles once or asks their own
   question (e.g., "Da dove viene lo zafferano?") hits the limit before
   the handoff or gets rushed through it. Bumping to 8 gives one turn of
   breathing room without softening the formal pacing.

## Railroading

- **offbeat T4:** Player asked "Questo risotto — c'è il burro nella
  mantecatura?" (a natural curiosity question before complimenting the
  dish). Alessandro responded with the insider detail, then "Le piace?"
  — the actual question was never directly answered, though the insider
  happened to touch on mantecatura. A cue to answer the guest's
  specific question before pivoting to the confidenza would prevent
  this.

- **offbeat T6:** Player, having asked two questions in a row, had not
  said the farewell phrase yet. Alessandro moved to the Elena handoff
  anyway. Harmless in a real session (handoff is the goal), but felt
  abrupt — a consequence of the turn-count pressure.

## Repetition / padding

- None. The scene is tight and purposeful; each beat has distinct
  content. This is a strength.

## Confusion

- Single character throughout — no cameo confusion. Strong.
- The plural pronoun leak (see issue 2) briefly created a "did someone
  else arrive?" moment for the blind player.

## Forced beats

- Beat 5 ("È straordinario!" / "Complimenti allo chef!") already names
  these as examples, not requirements, and the arc explicitly says to
  accept any reaction. No nagging observed. This was the old finding
  and was already fixed before this pass.
- No vocabulary gates remain.

## Pacing

With beat 4 split, the arc becomes 7 beats at maxTurns 8: greeting →
name → seat + menu → menu reaction → dish → insider/reaction → handoff.
Each turn carries distinct content. The formal register keeps things
brisk by design — Alessandro's brevity rule ("economia di parole") does
the work of a faster pace.

## Strengths

- Alessandro's voice — LEI-form, calore sotto la formalità, economy of
  words — is the best-realized character in the app. The formality
  guidance is precise and should not be weakened.
- The `chainTo` mechanic is clean and the intermezzoText is elegant.
- The insider payoff (Bartolini first Italian with three stars in two
  restaurants simultaneously) is a genuine "let me tell you something"
  moment and earns its place.
- Cultural framing (three-star booking culture, MUDEC, tasting menu
  structure) is excellent and belongs in `culturalNote`.

## Transcript snippets at the friction moment

**Blind player (T4 — triple-loaded beat):**
> Alessandro: "Le porto il primo piatto: Risotto allo zafferano con
> midollo di bue. Le confido — Bartolini è stato il primo cuoco italiano
> a ricevere tre stelle in due ristoranti contemporaneamente. Una rarità
> assoluta. Le piace?"
> Player: "Uh... sì? È... buono?" ← reacted to "Le piace?" without
> having absorbed the insider detail at all; it landed too fast.

**Anticipator (T4 — beat pressed too quickly):**
> Player: "È straordinario! Complimenti allo chef."
> Alessandro: [delivered insider + Le piace? in same breath, so
> anticipator already said "straordinario" before the insider arrived —
> the insider then felt like an afterthought, not a confidenza.]

**Offbeat (T5 — question unanswered):**
> Player: "Questo risotto — c'è burro nella mantecatura?"
> Alessandro: "La mantecatura è solo brodo del territorio — niente
> burro. Ed è proprio qui il segreto di Bartolini." ← good recovery,
> but only because the insider happened to touch on it; an unrelated
> question (e.g., about the saffron origin) would have been ignored.

## Script changes applied (this pass)

- **Split beat 4** into dish presentation and insider detail as two
  distinct moments: Alessandro presents the dish and asks "Le piace?";
  after the guest reacts, he volunteers the insider confidenza as a
  natural follow. This fixes the monologue, the hint timing, and gives
  offbeat players room to ask their own question before the insider
  lands. Arc goes from 6 to 7 beats; maxTurns lifted from 7 to 8.
- **Fixed the plural pronoun leak** in the hardcoded SCENARIO context
  sentence: `li accogli, li accomodi` is now gated on difficulty, so
  facile guests get singular throughout.
- **Updated whisperHints** from 6 to 7 entries to match the new beat
  shape: added `{trigger: 'insider', hint: 'Try: "Davvero?" o "Che
  bello!"'}` as a dedicated hint for the insider response beat (was
  previously misfiring one turn early).
- **`chainTo` preserved** intact. No characters added or removed.
