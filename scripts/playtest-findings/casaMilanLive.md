# Playtest — casaMilanLive (Paolo)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest casaMilanLive`).

---

## Pre-fix state (first pass)
- **Fun:** 5/10   **Friction:** 7/10 (higher = worse)
- A genuinely likeable host and a great setting undermined by a forced 10-step march, a single-voice cameo that confuses, and a step-7 vocabulary gate that turns the squad conversation into a covert quiz.

*(Note: the file's header comment claimed a rework had already been applied — maxTurns was reduced from 14 → 10 — but the body of `buildSystemPrompt` was never updated to match. The Napoli cameo, the forced-march instruction, and the vocabulary gate were all still live in the prompt. This pass completes the rework.)*

---

## Post-fix state (this pass)
- **Fun:** 8/10   **Friction:** 3/10 (estimated)
- Paolo-only scene. Loose beat sheet. Football banter breathes. A genuine "lasciami dire una cosa" payoff moment. Warm sign-off with the "Forza Milan!" close — an optional delight, never a blocker.

---

## Top issues (pre-fix)
1. **Single voice, two people — same problem as the old Navigli.** Step 8 instructed Paolo to become a Napoli tifoso mid-conversation ("Stessa voce, ma cambia tono/personaggio momentaneamente") and then revert. The blind player couldn't tell that a stranger had briefly taken the mic; the offbeat player tried to keep talking to the "Napoli fan" only to have Paolo snap back. Cut.
2. **Forced march — 10 steps, one per turn, always advance.** "ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO. Avanza sempre al passo successivo. Non ripetere mai lo stesso passo." With 10 mandatory steps and maxTurns 10, there was zero slack. The offbeat player who asked a follow-up question about the Champions League was immediately steamrolled into step 4's museum pointer.
3. **Step-7 vocabulary gate.** "Menziona prima l'attaccante, poi il portiere. Chiedi chi segnerà stasera. Crea momenti per 'l'attaccante', 'il portiere', 'segnare'." This turned Paolo into a covert quiz master who looped on specific football terms until the guest produced them.
4. **Tacked-on quiz ending.** Step 10's "Dove vai adesso?" with "Aspetta la risposta" is the same non-sequitur exit posture flagged in Navigli. Keep the destination reactions (they feed map transitions) but let them flow naturally.

---

## Railroading (pre-fix)
- offbeat T5: player asked "E il Meazza, quando era l'ultimo scudetto lì?" → Paolo ignored it and pivoted to step 6's memorabilia pride speech.
- offbeat T8: player responded to the Napoli "cameo" by asking "E tu, da dove vieni?" → Paolo instantly reverted to his own voice for step 9's shop beat, leaving the question unanswered and the player confused about who they'd been talking to.

## Repetition / padding (pre-fix)
- Steps 5 and 6 (user asks about a memento / Paolo explains with pride) were one beat split across two turns to fill the count. Merged.
- Steps 3 and 4 (team loyalty reaction + pivot to tour) were so rapid neither beat landed. Merged.

## Confusion (pre-fix)
- The Napoli cameo was the headline: one voice, two characters, no stage direction the listener can hear.

  **Blind persona (friction moment):**
  > Paolo (as himself): "Sette Champions League! Siamo leggendari. Ah, ecco — un tifoso del Napoli! [tone shift] Forza Napoli, eh!"
  > Player: "Sì... scusi, lei è Paolo o...?"
  > Paolo (back as himself): "Comunque, passiamo allo shop—"

  The blind player genuinely thought Paolo had been replaced.

## Forced beats (pre-fix)
- Step 7: Paolo was scripted to ask "chi segnerà stasera?" — a question the guest cannot meaningfully answer without knowing tonight's lineup.

  **Anticipator persona (friction moment):**
  > Paolo: "Chi segnerà stasera, secondo te?"
  > Player: "L'attaccante... il numero nove?"
  > Paolo: "Esatto! L'attaccante! E il portiere—"
  > Player: *(thinks: I'm being quizzed on vocabulary, not having a conversation)*

## Pacing (pre-fix)
- The genuine payoff — Paolo's personal passion, the Champions League story — existed in arc notes but got no "let me tell you something" spotlight moment.

## Strengths (preserved)
- Paolo's character voice: excitable, opinionated, warm. Carries the scene alone once the cameo is cut.
- Football vocabulary is naturally rich; the subject supports learning without forcing it.
- The destination send-off reactions are specific and charming (especially "San Siro! Ovvio — dopo Casa Milan, lo stadio. Logico!").
- The facile/normale/difficile difficulty split is well thought out.

---

## Script edits applied (this pass)

1. **Cut the Napoli tifoso cameo entirely.** Removed from the character intro line and from step 8. Rivalry banter folded into Paolo's own voice (he can invoke the Napoli angle himself: "i napoletani dicono che siamo fortunati — sette Champions League parlano chiaro!"). Removes one-voice confusion at a stroke.
2. **Replaced the 10-step forced march with a loose beat sheet** plus an explicit "segui l'ospite; reagisci a quello che dice davvero" rule — mirrors the navigliLive pattern.
3. **Removed the step-7 vocabulary gate.** Paolo's passion for the squad surfaces naturally from his enthusiasm; he no longer interrogates the guest for specific terms.
4. **Merged steps 3–4 (team loyalty + tour start) and steps 5–6 (memento + pride)** into single flowing beats. Freed turns for real football banter.
5. **Added a "lasciami dire una cosa" payoff beat** — Paolo's SETTE CHAMPIONS moment as a personal, passionate confidence, not a tour-guide fact.
6. **Dropped "Aspetta la risposta" from the sign-off.** Destination send-off still feeds the map transition; it now flows into a warm "Forza Milan!" close instead of a halting quiz posture.
7. **Updated maxTurns comment** (value was already 10; confirmed correct for the looser beat sheet).
8. **Updated whisperHints** to 7 entries matching the merged beat sheet (greeting → team → museum/trophy → squad → shop → farewell), trimming the positional mismatch.
