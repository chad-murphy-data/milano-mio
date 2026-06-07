# Playtest — duomoLive (Francesca)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest duomoLive`).

## Verdict
- **Fun:** 5/10 → est. 8/10 after edits   **Friction:** 8/10 → est. 3/10 after edits
- A knowledgeable, warm host sabotaged by a mid-scene voice-swap that was
  *annotated as fixed in comments but not actually removed from the prompt*,
  a rigid 10-step march, and a tacked-on destination quiz — identical
  structural problems to the pre-fix navigliLive.

## Top issues
1. **One voice, two people — Alberto cameo still live in the prompt.**
   The file header comment (line 4-6) claims the cameo was cut. It was not.
   Step 5 still instructs: "In questo turno tu PARLI COME ALBERTO, non come
   Francesca." In a single-voice Live session the learner hears Francesca's
   voice suddenly pitching pigeon photos. Every blind player interpreted this
   as Francesca going off the rails. The offbeat player tried to engage
   "Alberto" further and the scene deadlocked because Alberto has no arc of
   his own. The QA flag ("Improvising Chad could not complete the conversation")
   traces directly here — the voice-swap produces a one-frase cul-de-sac with
   no scripted exit for an engaged player.
2. **Rigid forced march.** The arc header reads "UN PASSO PER TURNO. Avanza
   sempre al passo successivo. Non ripetere mai lo stesso passo." Ten scripted
   beats with maxTurns 10 leaves zero slack. The offbeat player's natural
   questions were railroaded every turn.
3. **Duplicate "what do you want to see?" beat.** Step 2 asks the guest what
   they want to see; step 6 (after the Alberto recovery) asks again: "Dove
   eravamo... Volete vedere altro?" — the same beat repeated as if the scene
   forgot it already happened.

## Railroading
- **blind T1:** player said "Scusi… bagno?" → Francesca ignored it and asked
  what they wanted to see (step 2 advance).
- **offbeat T3:** player asked "Quante guglie ha il Duomo?" (natural tourist
  question) → Francesca skipped straight to the dress-code speech (step 4
  advance), ignoring the spires question entirely.
- **offbeat T5 (the deadlock):** player said "Quanto costano le foto?"
  trying to engage the "Alberto" voice → the script gave no continuation path;
  Francesca/Alberto had already fired its one frase and the model stalled,
  unable to advance without railroading or repeating.

  *Illustrative snippet — offbeat persona, turns 4-6:*
  > **Francesca:** "Le spalle devono essere coperte, e le ginocchia. Serve il biglietto — circa cinque euro."
  > **Chad:** "Capito. Quante guglie ci sono sul tetto?"
  > **Francesca (as Alberto):** "Foto con i piccioni! Solo cinque euro!"
  > **Chad:** "Ah… quanto costano esattamente?"
  > **[model stalls — no continuation scripted for Alberto engagement]**

## Repetition / padding
- Steps 2 and 6 both prompt the guest for their next destination: "cosa
  vogliono vedere" / "Volete vedere altro?" — two identical beats.
- Steps 3 + 4 (600-year history + dress code) are naturally one confident
  answer from a retired teacher, not two mandatory advance-each-turn beats.

## Confusion
- The Alberto voice-swap is the headline confusion: no staging cue, no
  re-identification — in audio the learner has zero anchor that a new
  character has appeared.
- Step 6's "Non lo guardare. Allora, dove eravamo..." is an odd
  self-aware reset line that signals the script is patching a problem rather
  than flowing naturally.

  *Illustrative snippet — blind persona, turns 4-5:*
  > **Francesca:** "Le spalle coperte — è obbligatorio per entrare."
  > **[same voice]:** "Foto con i piccioni! Solo cinque euro!"
  > **Chad:** "Scusi? Cosa? Eh... no grazie?"
  > **[same voice, as Francesca again]:** "Non lo guardare. Allora, dove eravamo?"
  > **Chad (blind, to author):** "Wait, was that her? Did she just offer me pigeon photos?"

## Forced beats
- "Non mi interessa" is set up as the *purpose* of the Alberto turn
  ("L'utente dovrebbe rifiutarlo") — a vocabulary gate disguised as a cameo.
  Remove the gate; keep the phrase as a warm tip Francesca offers pre-emptively.
- Destination lookup table at step 10 is a 10-entry quiz, not a warm goodbye.
  Same forced-beat pattern as the pre-fix navigliLive; same fix applies.

  *Illustrative snippet — anticipator persona, turns 9-10:*
  > **Francesca:** "Buona visita! Dove andate adesso?"
  > **Chad (anticipator):** "Andiamo... al museo? Pinacoteca?"
  > **[Francesca checks lookup table, finds no match, improvises]:** "Ah, bellissimo!"
  > **Chad:** "...that's it?"

## Pacing
Front-loads cleanly (greeting → Duomo facts → dress code) then hits the
Alberto dead-stop at turn 5. Recovery in steps 6-8 is adequate but the
Galleria/bull content — the warmest, most surprising part of the cultural
offering — is compressed into two quick beats. The genuine payoff (the mosaic
bull trick, the 600-year span) deserves space to land as Francesca's personal
"segreto", not a checkbox beat.

## Strengths
- Francesca's core persona — retired teacher, measured pace, deeply proud of
  her city — is compelling and fully capable of carrying the scene alone.
- The cultural content is rich and accurate: dress code, 600 years, bull
  mosaic, Galleria adjacency. More than enough for a complete, warm scene.
- The `openingHint`, `USCITA ANTICIPATA` clause, and `paceLine` language are
  well-crafted and should be kept.
- The destination-reaction mechanic feeds the app's map transitions and should
  be preserved (just made warmer and shorter).

## Script suggestions (applied in this pass)
- **Remove the Alberto voice-swap entirely from the prompt.** Fold the
  "non mi interessa" moment into Francesca's dress-code turn as a friendly
  pre-emptive tip: "C'è sempre qualcuno con i piccioni — basta dire 'non mi
  interessa'." The vocabulary survives as a gift, not a gate.
- **Replace the 10-step rigid march with a loose beat sheet**, same language
  pattern as the fixed navigliLive: "moments in any order; follow the guest's
  lead; acknowledge off-script answers before advancing."
- **Fold the duplicate "what do you want" beats** (old steps 2 + 6) into the
  opening, freeing a full turn for genuine engagement or the guest's own
  questions.
- **Give the bull-mosaic moment real space** as Francesca's personal segreto
  — the warmest beat in the scene, earned rather than checked off.
- **Keep the destination send-off** (feeds map transitions) but slim the
  reaction table to a short instruction, same approach as fixed navigliLive.
- **Update whisperHints** to remove the Alberto gate hint; keep the rest.
- **maxTurns stays at 10** — the looser beat sheet makes 10 feel spacious,
  not a countdown.
