# Playtest — bartoliniSommelierLive (Elena)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest bartoliniSommelierLive`).

## Verdict
- **Fun:** 5/10 → **7/10** (estimated after edits)   **Friction:** 7/10 → **3/10** (estimated after edits; higher = worse)
- Elena's voice and the wine setting are genuinely appealing. The pre-edit arc was a rigid 8-step checklist with a flat, dangling farewell — a procedural march instead of a dinner conversation. Edits loosen the arc into a beat sheet with a "follow the guest" rule and replace the dead-end farewell with a real payoff close that honors the full Bartolini chain.

## Top issues (pre-edit)
1. **Forced march — no "follow the guest" rule.** The arc instruction "AVANZA SEMPRE al passo successivo. Non ripetere mai lo stesso passo." left zero slack. With 8 mandatory beats and no instruction to acknowledge off-script answers, Elena railroaded every offbeat player. A character described as one who "si illumina when a guest asks questions" had no instructions to actually do that.
2. **Dangling farewell question with no payoff.** Step 8 asked "dove andate? Tornate in hotel, o ancora una passeggiata?" — a terminal scene (no `chainTo`, routes to debrief) with no reaction table and no warm close. The instruction was just "improvvisa qualcosa di adeguato al posto." The culmination of the whole Bartolini chain ended on a flat, improvised line instead of a memorable close.
3. **No "let me tell you something" payoff moment.** The arc was entirely procedural (wine announce → guest reacts → next wine announce). Elena is deeply knowledgeable about wine, but never shared a genuine insider insight. The scene had no memorable beat.

## Railroading (offbeat runs)

**offbeat T3:** Player responded to the Barolo announcement with "Ho letto che il Barolo invecchia vent'anni — questo è giovane?" (Natural curiosity about aging.) The forced-march arc moved immediately to the sorbetto step, ignoring the question entirely.

**offbeat T5:** Player asked "Passito — viene da Pantelleria? Ho sentito che è un'isola bellissima." The arc's step 6 instruction ("invita un'impressione") gave no guidance to engage with this — the character would accept "with warmth" and bulldoze to step 7 regardless.

## Repetition / padding
- Steps 3–6 repeat the identical micro-pattern: Elena announces → guest reacts → Elena accepts → Elena announces again. Four consecutive cycles with no variation. The beats are individually fine but rhythmically monotonous — a wine checklist, not a conversation.
- Steps 7–8 compress the emotional climax of the whole Bartolini chain into two turns that feel rushed after the slow procedural march.

## Confusion
- No multi-voice confusion — Elena is sole character throughout. Clean.
- Minor: the T0 `openingHint` (now corrected in the JS comments and whisperHints) previously prompted "Di che regione?" as an opening move — a question that only makes sense after Elena has named a wine. Already corrected in this file's whisperHints prior to this pass; confirmed correct.

## Forced beats
- No nagged call-and-response or vocabulary gate (unlike navigliLive's "crepi!" pre-rework). Good.
- Step 8 destination question was a forced beat with no payoff — requires an answer, no reaction table, no reaction guidance, no warm close. Cut in this pass.

## Pacing
- Turns 1–6: slow procedural march through four wines and a sorbetto.
- Turns 7–8: rushed emotional close allocated the same weight as "a sorbet arrives."
- This is the terminal scene of the Bartolini chain — it deserves more emotional weight at the close, not less.

## Strengths (preserved)
- Elena's voice is distinctive and well-realized: LEI-form throughout, economy of words, warmth beneath formality. Do not touch.
- The one-sentence-per-wine discipline is exactly right.
- The cultural note (sommelier as your friend, asking questions is a compliment) primes the learner excellently.
- No multi-voice confusion.

## Illustrative transcript snippets (friction moments)

**blind player — T0/T1 (hint misalignment, now fixed):**
> Elena: "Buonasera. Per iniziare, un Franciacorta del 2018 — fresco, perfetto con i Suoi antipasti."
> Player (reading T0 hint): "Uh... buonasera! Di che regione?"
> *(This was actually fine — the old hint issue was that T0 previously coached "Di che regione?" as an OPENING line before Elena had named anything. Now T0 hint correctly says to greet first; "Di che regione?" is offered as the natural follow-up once Elena has named the wine. Confirmed fixed in whisperHints.)*

**offbeat player — T3 (railroading):**
> Elena: "Per il secondo, un Barolo del 2016. Corposo, della Langa."
> Player: "Barolo — ho letto che invecchia vent'anni. Questo è giovane?"
> Elena: *(old arc forced advance to sorbetto step — genuine curiosity about aging ignored entirely)*
> *(After edit: new beat sheet says "se fa domande… rispondi con piacere — è il tuo momento" before advancing. Elena can now field this naturally.)*

**anticipator player — T7/T8 (flat farewell):**
> Elena: "Spero di rivederLa presto. E adesso, dove andate? Tornate in hotel, o ancora una passeggiata?"
> Player: "Una passeggiata lungo il Naviglio."
> Elena: *(no reaction table, improvises something generic — the Bartolini chain ends on a flat, forgettable line)*
> *(After edit: destination question cut entirely; replaced with a genuine wine-insight confidenza and a warm close that acknowledges the whole evening.)*

## Script changes applied (this pass)

- **Replaced the rigid 8-step "AVANZA SEMPRE" forced march with a loose beat sheet** (6 moments, not steps) headed by an explicit "segui l'ospite — if they ask a question, answer it before advancing" rule. Same moments, softer framing. This is the primary fix.
- **Cut the dangling destination farewell question.** This is a terminal scenario (no `chainTo`); the question served no mechanic and had no reaction table. Replaced with a genuine close.
- **Added a "momento-rivelazione" beat (beat 5):** Elena shares one real wine insider insight as a confidenza — three options keyed to the wines of the evening (Passito sun-drying, Nebbiolo as king of Italy, Franciacorta vs Champagne). The character is defined as passionate and knowledgeable; this gives her a genuine moment to show it.
- **Added a proper terminal close (beat 6):** A warm farewell that acknowledges the privilege of the whole evening — the right emotional weight for the end of the Bartolini chain. "È stato un privilegio accompagnarLa stasera."
- **No changes** to `whisperHints`, `maxTurns` (10), voice, vocabulary, LEI-form rules, or the one-sentence-per-wine discipline — those were already correct.
