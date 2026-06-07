# Playtest — viaDellaSpigasLive (Valentina)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest viaDellaSpigasLive`).

## Verdict
- **Fun:** 5/10   **Friction:** 7/10 (higher = worse)
- Valentina's voice is genuinely warm and the boutique setting is vivid — but
  a rigid 8-step forced march, a price-question that goes unanswered for three
  turns, a scripted item that ignores the guest's actual shopping purpose, and
  a tacked-on destination quiz keep it from landing.

## Top issues
1. **Forced march ignores the guest's actual intent.** "UN PASSO PER TURNO.
   Avanza sempre al passo successivo." The character *must* show a scarf
   regardless of whether the guest asked for bags, a gift, or a specific item.
   The offbeat player's "regalo per mia moglie, cerco borse" was ignored for
   three consecutive turns while the arc marched through silk-scarf → fabric →
   try-on (inviting the husband to try on his wife's gift). No room to deviate.
2. **"Quanto costa?" goes unanswered.** The arc places the price question at
   step 2 but step 3 *must* be fabric/craft, so the model skips the price.
   Both the blind and anticipator players asked "quanto costa?" and never got
   an answer before the arc moved on. A real shop assistant would answer a
   direct price question.
3. **Destination quiz ending.** "Dove va adesso?" + a 10-line lookup table is
   the same tacked-on exit quiz found in navigliLive before its rework. It
   reads as a non-sequitur; the scene's emotional arc (decision, elegant
   exit, warm send-off) has already resolved before it fires.
4. **No genuine "let me tell you something" moment.** Valentina has rich
   material to share — Como silk, the fashion quadrilateral's history, the
   "ci penso" cultural grace — but the script buries it in step 3 ("fatta a
   mano in Como") as a one-liner advance rather than a confident insider beat.

## Railroading
- **Offbeat T0:** player asked for "borse per regalo" → Valentina showed a
  silk scarf anyway ("Abbiamo appena ricevuto questa sciarpa di seta").
- **Offbeat T2:** player still asking about bags → Valentina moved to
  fabric description, then invited the husband to try on the scarf.
- **Blind T2:** player asked "quanto costa?" for second time → Valentina asked
  for their clothing size instead.

## Repetition / padding
- The arc has a distinct "color/size" step (4) and a "try-on" step (5) that
  both assume the guest wants to try the item personally. They overlap badly
  when the item is a gift or the guest declines to try it on.
- Step 6 ("Come Le sta?") fires immediately after the try-on invite even if
  the guest never actually entered the fitting room.

## Confusion
- No multi-voice confusion (Valentina is correctly single-host throughout —
  a strength over the original navigliLive).
- Minor: the `guestSetup` in `normale`/`difficile` difficulty introduces
  "Charlie" (Chad's wife) who never appears at `facile`. Fine in isolation,
  but the step-2 scripted item is a scarf — potentially odd if Charlie is
  present and has her own preferences.

## Forced beats
- "Dove va adesso?" destination quiz at the end — same pattern as old
  navigliLive. Warm in principle, but firing it as a mandatory step after the
  purchasing decision resolves makes it feel like homework.
- Step 4 forces "Che taglia porta?" even for a guest buying a gift for
  someone else — a natural friction point that no hint covers.

## Pacing
The arc covers greeting → browse → item → fabric → color/size → try-on →
opinion → buy/leave → destination in 8 mandatory steps across maxTurns 11.
That's sensible pacing for a boutique visit *if* the guest is cooperative, but
it collapses for any non-standard entry (gift-buyer, someone who declines to
try things on, someone who just wants to browse). The whisperHints track the
arc tightly, which means hints become wrong when the guest takes a different
path.

## Strengths
- Valentina's character voice — warm, elegant, non-pushy, switching to "ci
  penso" grace — is genuinely likeable and culturally accurate.
- The "Lei" register is consistently enforced and adds real texture.
- "USCITA ANTICIPATA" rule correctly respects "ci penso" as an elegant exit —
  good; keep it.
- No cameo confusion — Valentina is solo throughout. No surgery needed here.
- The cultural note (sizing, "ci penso") is excellent and deserves a spoken
  echo in the arc.

## Script suggestions (applied in this pass)
- **Replaced 8-step forced march with a loose beat sheet.** Added explicit
  "SEGUI L'OSPITE" and "ASSECONDALO" rules, plus "L'OSPITE VIENE PRIMA DEL
  COPIONE" framing — matching the navigliLive rework pattern. The old
  "UN PASSO PER TURNO. Avanza sempre al passo successivo." directive was
  removed entirely.
- **"Quanto costa?" now gets an answer.** Added an explicit rule: "Se
  l'utente chiede 'quanto costa?', dai una risposta plausibile e poi continua.
  Non ignorare il prezzo." Beat 3 also prompts a price reply if asked.
- **Gift-buyer path added.** Steps 5–6 now explicitly fork: if the guest is
  shopping for someone else, Valentina talks about indicative sizes and
  returns rather than asking the guest's own size or inviting them to try on
  a present.
- **Gave Valentina one real insider beat (step 4).** Three options — Como
  silk artisans, the "ci penso" cultural grace, the quadrilatero's postwar
  history — delivered as a warm confidence, not a mandatory advance.
- **Try-on beat made skippable.** Step 6 now says "solo se l'ospite vuole
  provarla davvero" — no longer a forced gate.
- **Destination send-off made optional.** Step 8 frames "dove vanno?" as
  "per gentile curiosità" and explicitly notes "Se preferiscono andare senza
  rispondere, va benissimo." — never a quiz. REAZIONI table kept (feeds map
  transitions) but framed as "UNA battuta calorosa."
- **whisperHints loosened** to track the beat sheet rather than the old march;
  hint 5 now covers both try-on and gift scenarios.
- **No cameo surgery needed** — Valentina was already solo throughout.
  maxTurns kept at 10 (already correct in the live block).

### Illustrative transcript snippets (friction moments)

**Blind — price question ignored:**
> Player: "È bellissimo! Quanto... cost-ah?"
> Valentina: "È fatta a mano a Como. La seta più pregiata d'Italia."
> Player: "Sì, ma — quanto costa??"
> Valentina: "Che taglia porta?"

**Anticipator — phrase-bingo march:**
> Player: "È bellissimo! Quanto costa?" [correctly guesses turn-1 hint]
> Valentina: [skips price] "È fatta a mano a Como..."
> Player: [thinks: "I said the right thing — why did nothing happen?"]

**Offbeat — gift-buyer railroaded into fitting room:**
> Player: "Cercavo un regalo per mia moglie. Ha borse?"
> Valentina: "Abbiamo appena ricevuto questa sciarpa di seta..." [step 2]
> [two turns later]
> Valentina: "Vuole provarla? Il camerino è là in fondo."
> Player: "...Io? Ma è un regalo. Non posso provarla io!"
