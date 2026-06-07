# Playtest — sanSiroMatchLive (Giuseppe)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest sanSiroMatchLive`).

## Verdict
- **Fun:** 6/10   **Friction:** 7/10 (higher = worse)
- A genuinely warm seatmate trapped in a forced 9-step march where match events are
  scripted as rigid turns, vocabulary is nagged into place, and the farewell is a
  destination quiz.

## Top issues

1. **"UN PASSO PER TURNO. Avanza sempre al passo successivo."** — the railroading
   instruction buried in the arc header. The offbeat player tested it hard: when they
   went off-script at the goal beat (asking Giuseppe "hai visto quel contropiede?"),
   the character blew past the question and force-narrated the curva beat. The line
   gives the character no permission to stay in a moment.

2. **Match events as scripted turns.** Steps 3–6 (goal, curva erupts, second half,
   referee controversy) are all things happening *on the pitch* — things the player
   can't see or affect. Giuseppe narrating them as gated beats means every turn
   becomes "Giuseppe announces event, player reacts." Fun for one or two, tedious by
   four. The blind player ran out of things to say by turn 5 and just mirrored
   Giuseppe's words back. A looser beat sheet lets Giuseppe *respond* to the match
   spontaneously rather than announce a scripted sequence.

3. **Tacked-on "Dove vai adesso?" quiz ending.** Step 9 is identical in structure to
   the destination-lookup ending flagged in navigliLive and other scenes. After ninety
   minutes of football passion, the character coldly asks where you're going and runs
   a lookup table. It's a non-sequitur exit gate, not a genuine shared-fan farewell.
   A better payoff: Giuseppe offers his contact, bids you "Forza Milan!" and maybe
   teaches "sarà per la prossima" as a warm closing button — then the destination
   reaction can be optional and brief.

## Railroading

- offbeat T3: player asked "ma come si chiama quel giocatore?" (naming a player) →
  Giuseppe ignored it entirely and jumped to "Senti la curva!" (step 4).
- offbeat T7: player said "ma abbiamo giocato bene, no?" (positive spin on loss) →
  Giuseppe railroaded straight to the philosophy beat, ignoring the disagreement.

## Repetition / padding

- Steps 3 and 4 (goal + curva) are sequential narration beats with no player agency
  between them: Giuseppe narrates a goal, then immediately narrates the curva roaring.
  The player has one word to say ("incredibile!") before the next beat steamrolls in.
- Steps 7 and 8 (defeat + philosophy) are two separate beats that carry the same
  emotional weight. They could easily be one moment.
- "Forza Milan!" appears as cue in the openingHint, step 1, and implicitly in every
  match beat — starts to feel like a verbal tic.

## Confusion

- Step 2 asks Giuseppe to combine "for whom they support" and "where are you from"
  in a single turn. That's two questions; the blind player answered only one and
  Giuseppe either had to repeat himself or skip the other. The anticipator navigated
  it, but beginners fumbled.
- The arc says "Risultato: una sconfitta" (step 7) — the outcome is hardcoded. But
  nothing prevents a player from celebrating a win in their response, then Giuseppe
  pivots to sadness with no setup. A small note clarifying that Giuseppe absorbs
  whatever the player says would help.

## Forced beats

- Step 3: "Menziona 'il primo tempo' esplicitamente" — vocabulary nagging. Giuseppe
  is supposed to shoehorn in the phrase naturally, but "Uno a zero al primo tempo!"
  as a mandatory utterance reads as word-insertion, not authentic fan speech.
- Step 4: "Crea il momento per 'la curva'" — another explicit vocabulary cue forcing
  Giuseppe to manufacture a pedagogical beat during what should be organic atmosphere.
- Step 9: destination quiz. All three personas flagged this as the worst turn.

## Pacing

The nine steps run: greeting → background → goal → curva → second half → referee →
final whistle → philosophy → departure quiz. That's five match-event beats back to
back (3–7). The genuine personal connection — Giuseppe's fifty-year history with this
club, the shared human moment — is nearly absent. The scene's best idea ("the person
next to you becomes your friend for ninety minutes") only pays off if Giuseppe talks
*about himself* as much as the match.

## Strengths

- Giuseppe's personality is strongly sketched and his voice is distinctive from Sofia
  (Navigli). The setup is the most evocative in the app.
- The cultural note on Italian football communality is accurate and warm; it matches
  what the scene is trying to deliver.
- The USCITA ANTICIPATA / destination-reaction mechanics are correctly implemented
  and preserve the map-transition payoff.
- maxTurns 11 gives genuine breathing room; the problem is the 9-step march that
  fills all of it with narration.

## Illustrative transcript snippets (friction moments)

### Blind persona — T5 (curva beat, player is lost)

> Giuseppe: "GOOOOL! Che gol! Uno a zero al primo tempo — incredibile!"
> Player: "Sì… molto… bello?"
> Giuseppe (should linger, celebrate together): "Senti la curva! Ascolti — FORZA
>   MILAN! Senti come cantano!"
> Player: *silence / "scusi?"*

The player had nothing to do between two consecutive match-event narrations. The
mandatory curva beat arrived before they could even process the goal.

### Anticipator persona — T9 (destination quiz)

> Giuseppe: "Dove vai adesso?"
> Player (confused): "Uhh… a letto? Sono stanco."
> Giuseppe: "A letto? Dopo una partita così? Vai a dormire con il sorriso!"

The anticipator guessed there'd be a "where next" prompt (they'd seen it in other
scenes) and gamed it. But it still felt like an exit form, not a farewell from a
friend.

### Offbeat persona — T3 (railroading)

> Giuseppe: "GOOOOL! Che gol! Uno a zero al primo tempo!"
> Player: "Sì! Ma come si chiama quel giocatore, il numero nove?"
> Giuseppe (should answer!): "Senti la curva! Ascolti —"

The character completely ignored a natural, plausible fan question and jumped to
the next scripted beat. The offbeat player was never acknowledged.

## Script changes (applied in this pass)

- **Replace "UN PASSO PER TURNO. Avanza sempre al passo successivo." with a
  loose beat-sheet framing** that explicitly tells Giuseppe to follow the guest's
  lead, answer off-script questions, and let match moments land before advancing.
- **Merge steps 3+4 (goal + curva) into one fluid beat** and merge steps 7+8
  (defeat + philosophy) into one, reducing the arc from 9 forced steps to 7 loose
  moments. This frees two turns for real human exchange.
- **Remove explicit vocabulary-insertion mandates** ("Menziona 'il primo tempo'
  esplicitamente", "Crea il momento per 'la curva'"). Giuseppe speaks naturally;
  the vocabulary appears organically or not at all.
- **Replace the step-9 destination quiz with a genuine farewell beat**: Giuseppe
  offers a warm parting, maybe his number for "the next match" — "in bocca al lupo"
  as closing button (same pattern that worked in navigliLive). The destination
  reaction becomes optional: if the player mentions where they're going, Giuseppe
  reacts warmly; if not, the scene closes without it.
- Update `whisperHints` to match the 7-beat arc and remove the "secondHalf" hint
  (now folded into the flow). Update comment on `maxTurns`.
