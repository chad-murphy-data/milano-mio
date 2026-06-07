# Playtest — trattoriaLive (Lorenzo)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest trattoriaLive`).

> **NOTE — second pass.** This file supersedes the earlier findings pass.
> The file header in `trattoriaLive.js` claimed a "Playtest rework" and
> updated `maxTurns` and comments, but the actual `buildSystemPrompt` body
> was not rewritten — the forced-march arc, double-stuffed turns, and
> destination quiz were still present. This pass diagnoses what remained and
> applies the surgery.

## Verdict
- **Fun:** 6/10 → est. **8/10** after edits   **Friction:** 7/10 → est. **3/10** after edits
- A warm host and excellent vocab trapped in an arc that *says* it was reworked but still runs a rigid 8-step march, double-stuffs two turns, kills the Lorenzo payoff moment, and ends on a destination quiz.

## Top issues
1. **The forced march survived the first rewrite.** The prompt still reads "ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo." That single line overrides every other instruction. The offbeat player was railroaded on every sideways answer.
2. **Lorenzo's payoff moment is squashed, not given.** The character description says Lorenzo "si illumina quando gli ospiti chiedono il suo consiglio" — but the arc immediately pressures him past that moment. When the offbeat player asked about saffron ("cos'è lo zafferano?") Lorenzo gave one flat noun and moved on to the next course. The cultural richness of the scene lives in `culturalNote` and never enters the conversation.
3. **Turn 7 double-stuff + "Era squisito" echo.** Step 7 asks Lorenzo to handle the bill request, confirm "Era squisito!", AND address the service charge question all in one beat. In playthroughs where the learner volunteered "Era squisito" at mid-meal (naturally and correctly), Lorenzo echoed it back redundantly at step 7 anyway.
4. **The destination quiz is still there.** "Dove andate adesso?" + 10-line reaction table at the end of a dinner — same non-sequitur exit gate that hurt Navigli. One anticipator answered "trattoria" (confused — they just left one) and Lorenzo had nothing coherent to say.

## Railroading
- **Blind T3:** Guest answered "rosso?" (wine). Lorenzo immediately confirmed + fast-forwarded through the entire meal to "È tutto bene?" in a single turn. Time collapsed — the learner had no idea whether they were still ordering or halfway through dinner.
- **Offbeat T0:** Guest asked "come si pronuncia 'risotto'?" at the door. Lorenzo ignored the question entirely and advanced to seating.
- **Offbeat T2:** Guest asked "cos'è lo zafferano?" — the exact moment for Lorenzo's food-pride to bloom. Lorenzo answered with one flat noun and immediately pressed for the second-course order.

**Illustrative snippets:**

*Blind — T3 friction (time collapse):*
> Player: "Uh… rosso?"
> Lorenzo: "Ottimo. Porto subito. È tutto bene?" [The entire meal — ordering, serving, eating — vanished between two sentences. The learner has no idea where in time they are.]

*Anticipator — T5 echo friction:*
> Player (T4): "Era squisito!"
> Lorenzo (T5, after bill): "Certamente! Era squisito, vero? Il servizio è compreso. Dove andate adesso?" [Lorenzo repeated the guest's own phrase back verbatim, then fired three more exchanges without breathing room.]

*Offbeat — T2 railroading (the killed payoff):*
> Player: "Questo risotto… cos'è lo zafferano?"
> Lorenzo: "Lo zafferano è una spezia pregiata. Il risotto è eccellente. E per secondo, cotoletta o brasato?" [One flat noun, then forced the order forward. This was the scene's natural "let me tell you something" moment — squashed by the march.]

## Repetition / padding
- "Era squisito" appears in the arc *and* in whisperHints. In any playthrough where the guest says it naturally at mid-meal, Lorenzo echoes it at the bill — redundant.
- Step 5 mid-meal check ("È tutto bene?") and step 2's brief specialty mention overlap in substance — both are about the food, neither is distinctive.

## Confusion
- No cameo/multi-voice confusion. Lorenzo is the sole host — a genuine strength. No changes needed here.
- Minor: step 3 implies the guest must ask first ("Chiedono cosa consigli"). The blind player who didn't know to ask got an awkward half-pause before Lorenzo prompted them. Fix: make Lorenzo volunteer the recommendation proactively ("Se posso permettermi…") rather than waiting for the trigger phrase.

## Forced beats
- The destination quiz at step 8 is a non-sequitur gate. The learner has just paid — they want warmth, not a quiz about where they're going.
- Step 3 implicitly gates on "Cosa consiglia?" The blind player sat through an awkward pause before the character prompted them.

## Pacing
The arc's substance easily supports 8-10 turns, but the "always advance" rule turns it into a conveyor belt where the richest moment (Lorenzo's food knowledge) gets compressed into one flat noun. The conversation's emotional centre — the saffron story, the cotoletta origin — is locked in `culturalNote`.

## Strengths
- Lorenzo's character voice is clear and genuinely appealing: professional, quietly proud, warms when asked for advice. Strong base.
- Single-host scene — zero multi-voice confusion. Keep.
- "Riformula naturalmente" error-handling instruction is well-crafted. Keep.
- `openingHint` is well-calibrated.
- Vocab and phrase lists are excellent and scene-matched.
- The `USCITA ANTICIPATA` early-exit clause is good. Keep.

## Script suggestions (applied in this pass)
- **Replace "UN PASSO PER TURNO / Avanza sempre" with a loose beat sheet.** Same beats, loosened grip. Add explicit "segui l'ospite" and "acknowledge off-script answers before moving on" rules — modelled on navigliLive's rework.
- **Add Lorenzo's genuine payoff moment.** When asked about the food (or when the moment feels right), Lorenzo volunteers one authentic Milanese secret as a "confidenza" — e.g. the saffron in risotto alla Milanese traces to a 1574 wedding prank, or cotoletta is Milan's original schnitzel. This is the scene's emotional centre.
- **Fix step 3:** Lorenzo opens the recommendation proactively ("Se posso permettermi…") rather than waiting for the guest to know to ask. Whisper hint still coaches the phrase as an optional delight.
- **Unsplit step 7:** Bill gets its own beat. "Era squisito" and "È compreso il servizio?" are natural guest lines — don't pre-empt them. If the guest already said "Era squisito" mid-meal, acknowledge it warmly rather than echoing it again.
- **Replace the destination quiz** with a brief warm "where are you off to?" that's optional and woven into the farewell, not a lookup-table gate. Trim the reaction table to an instruction — same map-transition mechanic, less gate-feel.
- **Update `maxTurns`** — already at 10, which is right. No change needed.
- **Update whisperHints** to add a hint for the Lorenzo payoff moment and remove the farewell hint that pre-empts "È compreso?" (let the learner discover it).
