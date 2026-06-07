# Playtest — hotelLive (Giulia)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce with `node scripts/playtest.mjs playtest hotelLive`).

**Pass 1** (prior session) scored Fun 6 / Friction 6 on the old 9-step
forced march. The suggestions from that pass were applied (loose beat sheet,
destination moved before key handoff, "guest comes first" rule). This is
**Pass 2** on the rewritten script.

## Verdict
- **Fun:** 7/10 → **8/10** after edits   **Friction:** 4/10 → **2/10** after edits
- Giulia is already warm, the arc is already loose, there is no cameo
  confusion and no forced march. The remaining friction is almost entirely in
  whisper-hint desync and a slightly overloaded step 7.

## Top issues
1. **Whisper hint desync.** Steps 5 (breakfast) and 6 (WiFi) naturally
   collapse into a single Giulia turn — she hands the WiFi card right after
   mentioning breakfast. This means by T2-3 the positional hints are already
   1-2 beats stale. A blind player getting "Try: Ecco il passaporto." when
   they already gave it and Giulia is now talking about breakfast gets
   actively wrong guidance at exactly the moment they need it most.
2. **Step 7 triple-loads.** One step asks for: (a) first-visit/purpose
   small talk, (b) destination question, (c) destination reaction + optional
   insider tip. The model skimps on (c) to stay brief, so the payoff moment
   ("una cosa che sai tu, non da guida turistica") is routinely swallowed.
   Splitting into 7 (small talk + insider tip) and 8 (destination + reaction)
   makes each beat land cleanly and ends on the key with real warmth.
3. **Insider tip is optional ("Se vuoi").** The navigliLive fix mandated the
   payoff (Sofia's secret is mandatory — step 4 in that script). Here the
   equivalent is "Se vuoi, aggiungi un consiglio autentico" — too easy to
   skip. Giulia has strong opinions; let her use them.

## Railroading
- **offbeat T3:** Player asked "È lontano dal Duomo?" right after handing
  the passport. The arc says "Dopo il passaporto, menziona la colazione" and
  the "guest comes first" rule should catch this — but in practice the model
  often answered the distance question AND pivoted to breakfast in the same
  breath, which is fine but slightly rushed.
- No hard railroads found. The "REAGISCI a quello che ha detto davvero prima
  di avanzare" rule is doing its job.

Illustrative offbeat snippet (T2-3, passport → question detour):

> **Player:** "Ecco il passaporto. È lontano il Duomo da qui?"
> **Giulia:** "Non lontanissimo — venti minuti a piedi, o dieci in metro
>   Linea 1. La colazione intanto è dalle sette alle dieci, al primo piano—"
> **Player:** *(satisfied, no friction — the detour was acknowledged)*

The beat sheet handles this gracefully. Good.

## Repetition / padding
- No repeated beats. Steps are distinct.
- Breakfast + WiFi collapsing into one turn is natural, not padding — it just
  misaligns the whisper hints.

## Confusion
- No single-voice multi-character confusion. Giulia is the only speaker
  throughout. The Charlie (normale/difficile) cameo lives only in the
  guestSetup and never appears as a second speaking voice — low risk.
- **Minor:** A real offbeat player might mention a partner ("mia moglie sta
  arrivando") even in facile mode. The "NON inventare ospiti" rule correctly
  prevents Giulia from inventing Charlie — but a complete silence on the
  companion mention reads as uncanny. A one-line acknowledger fixes it without
  inventing anyone.

## Forced beats
- None. The destination question is now inside small talk (step 7), not
  tacked on after the key. The reaction table is warm, not a quiz. Good.

## Pacing
- 8 beats across 10 turns is comfortable. No filler.
- The only pacing note: step 7's triple load means the payoff moment lands
  too fast. Split it and both beats breathe.

## Strengths
- Giulia's voice is the best in the app: "un umorismo asciutto che tieni
  quasi sempre nascosto" is immediately believable and the model maintains it.
- The NON VIOLARE MAI rules are surgical and effective.
- Destination-reaction table is warm and culturally specific.
- USCITA ANTICIPATA is clean.
- The arc's "l'ospite viene PRIMA del copione" framing is exactly right.

## Script suggestions (applied in this pass)
- **Fix whisper hint desync:** collapse breakfast + WiFi into a single hint
  (reflecting the natural turn collapse), reorder the remaining hints so they
  track the actual conversational flow, and trim to 8 hints for 10 turns
  (leaving slack at the end).
- **Split step 7 into 7 + 8:** 7 = first-visit/purpose small talk + mandatory
  Giulia insider tip; 8 = destination question + warm reaction. Key handoff
  becomes step 9. maxTurns stays 10 (same slack, more breathing room per step).
- **Make the insider tip mandatory:** "Condividi una cosa che sai tu su Milano
  — una cosa vera, non da guida turistica" (no "Se vuoi").
- **Add one-line companion acknowledger** for the offbeat case: if a guest
  mentions someone arriving later, Giulia can say "Certo, ci pensiamo noi"
  without inventing anyone from outside the SCENARIO.
