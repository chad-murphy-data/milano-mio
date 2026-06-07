# Playtest — caffeLive (Marco)

Author: in-session sub-agent pass × 2 (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest caffeLive`).

---

## Pass 1 findings (first sub-agent)

### Verdict
- **Fun:** 7/10   **Friction:** 4/10 (higher = worse)
- A genuinely charming caffe scene that earns its mechanical A grade. Marco's voice is warm and specific (the cappuccino-eyebrow alone is a delight), the setting is rich, and the destination one-liners land. No cameo confusion, no vocabulary gates, no nagging. Friction is low — but two things nag: an offbeat player asking natural follow-up questions gets gently railroaded because there is no "follow the guest" rule, and the price-pause beat creates dead air in voice.

### Top issues (Pass 1)
1. **No "follow the guest" rule.** The arc has nine explicit steps and says "Avanza sempre al passo successivo dopo che l'utente risponde." That's fine for the blind and anticipator personas, but the offbeat player hits trouble the moment they ask Marco a natural question ("sei milanese?", "cos'è un cornetto?"). The character has no explicit instruction to acknowledge the guest's actual words before advancing. The scene doesn't railroad *badly*, but it nudges.
2. **Price-pause dead air.** Step 6 tells Marco to say "Allora... Dunque, vediamo..." and then *wait* for the user to volunteer "Quanto costa?" before giving the price. In live voice, this pause is awkward — it can read as Marco forgetting what he was doing. The step already says "Se dopo la pausa l'utente NON chiede, dilla tu comunque" — so the pause is optional anyway. Better to make the pause a natural beat Marco can take or leave, not a scripted elicitation.
3. **Cornetto upsell is transactional, not warm.** Marco's "Un cornetto anche? Sono appena sfornati!" is a good line, but it's pure sales. No insider warmth. The scene's cultural note tells the player Milan has great cornetti, but Marco never says anything that makes the player feel let-in on something.

### Script suggestions (Pass 1, applied)
- **Add a "SEGUI L'UTENTE" rule** (one sentence in the REGOLA block) modelled on navigliLive.
- **Loosen the price-pause.** Remove the scripted dead-air elicitation; Marco gives the price naturally, and if the guest volunteers "Quanto costa?" first, he answers it.
- **Warm up the cornetto beat.** Add a one-line insider aside: "Qui li facciamo col burro — non quella roba industriale."

### Transcript snippets (Pass 1)

#### Blind — price pause dead air
> **Marco:** "Sicuro? Sono i migliori della via... Allora... Dunque, vediamo..."
> **Chad:** [long pause] "Uh..."
> **Marco:** "Sono due euro cinquanta."
*Dead air while Marco waits for "Quanto costa?" The user didn't know the cue. Marco gave the price anyway — the pause added nothing.*

#### Offbeat — no "follow the guest" rule
> **Chad:** [mid-arc] "Marco, sei di Milano?"
> **Marco:** "Sì, sono milanese! Allora, sono tre euro."
*Marco jams the personal answer and the price together to stay on arc. An explicit "SEGUI L'UTENTE" instruction would let him give the personal answer its own moment.*

#### Anticipator — smooth sailing
> **Chad:** "Un caffè, per favore."
> **Marco:** "Certo! Prima volta a Milano?"
> **Chad:** "Sì, prima volta!"
> **Marco:** "Un cornetto anche? Sono appena sfornati."
*The anticipator found the arc intuitive and the beats landed cleanly.*

---

## Pass 2 findings (second sub-agent, post-Pass-1 edits)

### Verdict
- **Fun:** 8/10 (was 7)   **Friction:** 2/10 (was 4) (higher = worse)
- The "SEGUI L'UTENTE" rule added in Pass 1 resolves the mild railroading. The scene is genuinely warm and Marco's voice is the strongest single-character voice in the suite. One remaining gap discovered: the companion-ask in step 3 (normale/difficile) is hardcoded to assume a wife or girlfriend ("E per la tua signora?"), which railroads any offbeat player who brought a son, a friend, or a colleague.

### Top issues (Pass 2)
1. **"E per la tua signora?" hardcodes wife assumption.** In normale/difficile the companion beat is scripted as "E per la tua signora? / E per lei?" — which presupposes a wife or girlfriend. An offbeat guest who said "siamo in due, io e mio figlio" will hear Marco ask for "la signora" and have no natural way to respond. The blind player doesn't notice (facile is solo); the anticipator uses the expected wife setup; the offbeat player hits it squarely.
2. **Price-pause** (inherited, addressed in Pass 1 edits — confirmed resolved): the "Allora... dunque, vediamo..." dead-air instruction was the main remaining friction from Pass 1. Now removed in this pass.
3. **Cornetto warmth** (addressed in Pass 1 edits — confirmed improved): "Sono appena sfornati!" upgraded to insider-warmth line. Marco now sounds like a local, not just a salesperson.

### Railroading (Pass 2)
- **offbeat T3 (normale):** guest says "siamo in tre — io, mia moglie e mio figlio" → old script would ask "E per la tua signora?" and ignore the mentioned child. Fixed in this pass: Marco now adapts the companion ask to whoever the guest described.

### Repetition / padding
None. Nine-step arc is well-paced for a caffe transaction.

### Confusion
None. Marco is single-voice throughout. No cameos. No ambiguous speaker switches.

### Forced beats
The "Dove andate adesso?" destination ask is mildly non-sequitur, but brief, warm, and feeds the map-transition mechanic — keep it. No vocabulary gates. No nagged call-and-response.

### Pacing
Good. maxTurns 10 for a 9-beat arc leaves one turn of breathing room — enough for a fumble or a side question. `endOnCharacterFarewell: true` closes the session as soon as Marco waves goodbye; in practice a smooth anticipator finishes in 8 turns.

### Strengths
- Marco's cappuccino eyebrow ("Di pomeriggio...?") is the best single beat in the caffe suite — culturally sharp, character-revealing, and funny without being mean.
- The companion arc in normale/difficile is a structural win: two natural opportunities to produce real Italian without a quiz.
- Single-voice, no cameo noise.
- `endOnCharacterFarewell + FINE NATURALE` prevents post-farewell padding.
- Destination reaction table is already warm and trimmed; "La Spiga... porti il portafoglio!" is exactly right.

### Script changes applied in Pass 2
1. **Broadened the companion-ask** in step 3 (normale/difficile): Marco now adapts the follow-up to whoever the guest described ("mia moglie" → "la tua signora"; "mio figlio" → "tuo figlio"; unspecified → "l'altra persona"). Eliminates the wife-assumption railroad.
2. **Removed price-pause dead-air instruction** in step 6: Marco gives the price naturally without scripting a wait-for-"Quanto costa?" beat. If the guest asks first, Marco answers immediately.
3. **Added insider warmth to cornetto beat** in step 5: "Qui li facciamo col burro — non quella roba industriale" replaces the plain "Sono appena sfornati!" — Marco sounds like a local sharing a secret.
4. **Broadened whisperHints[2]** from wife-only ("E per mia moglie") to include a friend example ("E per il mio amico").

### Transcript snippets (Pass 2 — friction moment)

#### Offbeat — signora assumption (before fix)
> **Chad:** "Sì, siamo in due — io e mio figlio."
> **Marco (old script):** "E per la tua signora?"
> **Chad:** "No... mio figlio. Um, un succo?"
*Marco ignored the described companion and asked for a "signora" who wasn't there. Fixed: Marco now reads who the guest described and adapts.*

#### Blind — price step (after fix)
> **Marco:** "Ottimo! Sono tre euro."
> **Chad:** "Ecco."
*Clean. No dead air. Price came naturally.*

#### Anticipator — clean run (still clean after edits)
> **Chad:** "Buonasera. Un caffè, per favore."
> **Marco:** "Buonasera! Siete in compagnia?"
> **Chad:** "Sì, siamo in due. Mia moglie."
> **Marco:** "Cosa prendete? E per la tua signora?"
> **Chad:** "Per mia moglie un cappuccino."
> **Marco:** "Di pomeriggio...? Eh, cosa vuoi fare. Allora — un cornetto? Qui li facciamo col burro."
*Cappuccino eyebrow still lands; cornetto line now has warmth.*
