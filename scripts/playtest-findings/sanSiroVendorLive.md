# Playtest — sanSiroVendorLive (the Vendor)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest sanSiroVendorLive`).

## Verdict
- **Fun:** 6/10 → 8/10 (est.)   **Friction:** 7/10 → 3/10 (est.)
- A lively matchday vendor with a strong street voice, trapped before the
  rework by a rigid 7-step march, a nagged crepi gate, and a triple-beat
  finale that fires three things at once with no satisfying payoff.

## Top issues

1. **Railroad march line.** "ARCO DELLA CONVERSAZIONE — UN PASSO PER TURNO.
   Avanza sempre al passo successivo." overrides everything. The offbeat
   player asked "Che partita è stasera?" — a completely natural tourist
   question — and the vendor ignored it to pitch a bundle price because Step 3
   says "contrattazione." Same rigid-march pattern that sank navigliLive before
   its rework.

2. **Nagged crepi gate at Step 7.** The script instructed the vendor to actively
   prompt "Si dice 'crepi'! Forza Milan!" if the learner didn't produce the
   word unprompted — a vocabulary quiz, not a farewell. The anticipator player,
   having absorbed the cultural note, said "In bocca al lupo!" first — inverting
   the expected roles with no scripted path to recover.

3. **T7 triple-stack / tacked-on exit quiz.** The final turn fired: farewell +
   crepi-nag + "Dove vai dopo? Tornerai per un'altra partita?" — three beats
   at once, none a satisfying payoff. The "Tornerai?" question read as a
   non-sequitur exit quiz (identical pattern to pre-rework navigliLive).

4. **Missing insider payoff at Step 5.** "Stasera vinciamo, eh? Forza Milan!" is
   a slogan, not a moment. The cultural note says the official shop inside charges
   twice as much — that line belongs in the vendor's mouth as a conspiratorial
   aside, not buried on a card nobody reads mid-conversation.

## Railroading
- offbeat T2: player asked "Avete programmi in inglese?" → vendor ignored it,
  jumped to Step 2 product-and-price pitch.
- offbeat T3: player asked "Che partita è stasera?" — a real tourist's first
  question — vendor steamrolled into bundle-price negotiation.

## Repetition / padding
- Steps 2 and 3 both involve price; they blur together if the learner doesn't
  initiate a counter-offer, producing two consecutive price turns.
- "Forza Milan!" appeared in Step 5's scripted line AND in the Step 7
  nag-recovery line — the catchphrase lost its punch by doubling.

## Confusion
- No single-voice/multi-character confusion (facile is solo Chad; the vendor
  is the sole character throughout — clean).
- The anticipator's "In bocca al lupo!" first inverted the scripted exchange:
  Step 7 says the VENDOR offers it and WAITS for "crepi" — but if the learner
  beats the vendor to it, the original script had no recovery path.

## Forced beats
- crepi call-and-response with explicit nagging ("Si dice 'crepi'! Forza
  Milan!") — a quiz, not a toast.
- "Dove vai dopo? Tornerai per un'altra partita?" — exit quiz bolted on after
  the farewell.

## Pacing
The haggle beat (Step 3) is genuinely fun and earns its place — vendors
negotiate, learners feel the buzz. But the arc front-loaded a mechanical
purchase sequence and then deflated: thin match-talk, a wayfinding detour, a
cluttered sign-off. The emotional high (buying the scarf, feeling like a real
tifoso) happened mid-arc; the end needed its own payoff.

## Strengths
- The vendor's voice is the best thing in the script: svelto, amichevole, da
  strada. "Fatta a mano! Non come quelle dentro lo stadio" is exactly right.
- The haggle beat is charming and culturally authentic — kept intact.
- The "Cancello rosso, da quella parte!" gate-direction is a nice functional
  touch; kept.
- USCITA ANTICIPATA clause is well-written; kept.
- No cameo characters to cut (solo scene from the start — a clean advantage
  over navigliLive).

## Transcript snippets — friction moments

### blind · T7 (triple-stack)
> **Vendor:** Buona partita! In bocca al lupo! — *[waits]* — Si dice "crepi"!
> Forza Milan! Dove vai dopo? Tornerai per un'altra partita?
>
> **Blind:** Eh... sì? Crepi? Um... hotel?

*Three prompts land at once with no anchor. Blind player grabs the last thing
they heard.*

### anticipator · T6 (role reversal)
> **Anticipator:** Grazie! In bocca al lupo!
>
> **Vendor:** Crepi! *[then waits for learner to say crepi — but learner
> already said "in bocca al lupo", so the roles are inverted and the script
> stalls]*

*Anticipator used the phrase correctly; the original script penalised them
for knowing it.*

### offbeat · T3 (railroad)
> **Offbeat:** Che partita è stasera?
>
> **Vendor:** Dai, per te ventidue euro tutt'e due! Affare!

*Completely natural tourist question; vendor ignored it to hit Step 3.*

## Script edits applied

- **Replace the railroad march** ("UN PASSO PER TURNO. Avanza sempre al
  passo successivo.") with a loose beat sheet that explicitly says "segui
  l'utente" and tells the vendor to answer off-script questions before
  advancing — same fix as navigliLive.
- **Add a genuine insider payoff** to the match-talk beat: the vendor drops
  the "inside shop charges twice as much" line as a conspiratorial aside
  before the "Forza Milan!" button — turns a slogan into a real moment.
- **Move crepi to the sign-off; one gentle attempt, never a nag.** Vendor
  offers "In bocca al lupo!"; if learner says "Crepi!" vendor celebrates; if
  not, teaches it warmly once and closes — never blocks the farewell.
- **Add a recovery path for the anticipator inversion:** if the learner says
  "In bocca al lupo!" first, the vendor responds "Crepi! Bravo!" and closes
  naturally.
- **Cut the exit quiz ("Dove vai dopo? Tornerai?").** Replaced with a single
  warm send-off; keeps the finale lean and satisfying.
- `maxTurns` 8 (was already correct in the file before this pass — the
  comment referencing the rework was already in place).
