# Playtest — navigliLive (Sofia)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest navigliLive`).

## Verdict
- **Fun:** 4/10   **Friction:** 8/10 (higher = worse)
- A warm host trapped in a forced 8-step march with a confusing body-double cameo and a nagged vocabulary quiz.

## Top issues
1. **Single voice, three people.** Sofia silently becomes "Luca e Marta" at steps 3–7 and back to Sofia at step 8. The file itself admits "la voce è la stessa, ma il tono cambia." In one-voice Live the learner cannot tell who's talking — the blind player kept answering Sofia as if she'd asked where *she* was from.
2. **The "crepi!" gate.** Step 6 orders the character to *nag*: "Se non lo dicono, ridi e sollecita: 'Devi dire crepi!'" Being badgered to produce one exact word is the single most "tough to get through" moment. It's a quiz, not a toast.
3. **Forced march.** "L'ARCO È BREVE E VIVACE — 8 passi… NON RIEMPIRE SPAZIO… Ogni turno deve avanzare l'arco." With maxTurns 9 and 8 mandatory beats there is zero room to breathe, fumble, or ask your own question. The offbeat player was railroaded every time.
4. **Tacked-on ending quiz.** "Dove andate adesso?" + a 10-line destination lookup table reads as a non-sequitur exit quiz, not a warm send-off.

## Railroading
- offbeat T4: player asked Luca "e voi, di dove siete?" → character ignored the returned question and jumped to "quanto restate?"
- offbeat T7: player riffed on the cemetery tip → character steamrolled into "in bocca al lupo!" regardless.

## Repetition / padding
- "un posto segreto" / "cosa consigliate" recur 4–5×; the recommend beat overlaps with the locals' tip.
- The arc both has the guest ASK for a recommendation and the locals GIVE one unprompted — the same beat twice.

## Confusion
- Unsignalled Sofia→couple→Sofia switches (the headline problem).
- "Cosa consigliate voi?" (Sofia asking the *guest* to recommend) confused every persona — beginners can't recommend Milan.

## Forced beats
- crepi call-and-response with explicit nagging.
- destination quiz at the end.

## Pacing
Front-loaded with a drink order, then a long social detour with strangers, then a vocabulary gate. The genuine payoff (aperitivo ritual, Leonardo's canal locks, Campari born in Milan) lives only in the cultural note and never becomes a *moment*.

## Strengths
- Sofia's core voice — relaxed, creative, proud of her neighborhood — is genuinely likeable and can carry the whole scene alone.
- The aperitivo setting is rich; the buffet beat is charming.

## Script suggestions (applied in this pass)
- **Cut the Luca/Marta cameo. Make it Sofia-only.** Removes the one-voice confusion at a stroke; Sofia is more than warm enough to carry it.
- **Keep the crepi exchange — it's fun — but move it to the sign-off.** (Per Chad's note: the "in bocca al lupo / crepi!" bit was enjoyable, just "SUPER forced and weird in the middle.") It's now the scene's closing button: Sofia wishes them "in bocca al lupo per il viaggio!" on the way out, the guest answers "crepi!", and if they don't know it she teaches it warmly and celebrates — one gentle attempt, never a blocker.
- **Replace the 8-step march with a loose beat sheet** plus an explicit "follow the guest's lead, acknowledge off-script answers, let them ask you things" rule.
- **Give the scene a real payoff beat:** Sofia shares one true Navigli secret (Leonardo helped design the canal locks / Campari was invented in Milan) as a "let me tell you something" moment.
- **Keep the destination send-off but make it warm and optional**, trim the reaction table to a short instruction (still feeds the map transition).
- Update `whisperHints` and `maxTurns` to match the looser flow.
