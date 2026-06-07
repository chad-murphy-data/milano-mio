# Playtest — sanSiroEntry (Nonno Aldo)

Author: in-session sub-agent pass (no API key in this env; harness can
reproduce this with `node scripts/playtest.mjs playtest sanSiroEntry`).

## Verdict
- **Fun:** 6/10 → 8/10 (est.)   **Friction:** 4/10 → 2/10 (est.)
- A clean, warm, single-host booth — no railroading, no cameo confusion, no
  forced march. The bones are solid. The problem is that Aldo never *shows up*
  as a person: step 2 lets the model pick weather/maglia/anything, so it
  defaults to a generic line ("Bella maglia!") and the scene ends before the
  nonno warmth lands.

## Top issues
1. **Arc step 2 underspecified.** "Sulla maglia, sulla partita, sul tempo,
   o una battuta da vecchio tifoso" gives equal weight to weather chat and
   genuine Aldo warmth. Models take the path of least resistance — a generic
   jersey compliment — and the player never meets Aldo the person, just a
   pleasant ticket machine. A few concrete example lines (a real match memory,
   a stadium observation, a nonno detail) give the model vivid material and
   make every playthrough feel different.
2. **No closing delight — and maxTurns 3 cuts it off anyway.** "Buona partita,
   forza Milan!" is correct but thin. A nonno with forty years at this booth
   closes with something. The navigliLive rework proved that "in bocca al lupo
   / crepi!" is a perfect warm sign-off button — it belongs here too. But with
   maxTurns 3 (exactly Aldo's three scripted turns), any offbeat follow-up
   question hits the wall before Aldo can respond at all.
3. **whisperHints are trigger-keyed strings, not positional indices.** Minor
   structural mismatch with the navigliLive pattern and the roadmap for
   `whisperHints[turn]` in LiveConversationScreen. Realigned to positional
   order (greeting → ticket → comment/memory → lupo → farewell) so they'll
   wire in cleanly when the hook ships.

## Railroading
None structural. The "rispondi naturalmente e vai avanti" instruction handles
offbeat answers adequately, BUT the offbeat player's most natural move —
asking Aldo how long he's worked here — hits maxTurns 3 before Aldo can
answer. Not a script bug, but a turn-cap problem that reads as railroading.

## Repetition / padding
None. Three beats, each distinct. The scene doesn't overstay its welcome.

## Confusion
None. Single host throughout — no cameo, no voice-split problem. This is the
scenario's clearest structural strength.

## Forced beats
None in the original. "In bocca al lupo" added to sign-off is explicitly
optional (one warm attempt, never a blocker, never a nag).

## Pacing
Very tight (maxTurns 3 / three Aldo turns). Appropriate for a transactional
booth, but the new "in bocca al lupo" exchange and any offbeat fumble need one
extra turn of breathing room — bumped to maxTurns 5.

## Strengths
- Single host, no confusion.
- Strong anti-coaching rules (no "prova a dire", no English, no action narration).
- Early-exit handled gracefully.
- Good cultural grounding in sceneDescription and culturalNote.
- Arc is honest about its length; zero padding.

## Illustrative transcript snippets (friction moments)

### blind — step 2 flatness
> **Aldo:** "Bella maglia! Milan è nel cuore, eh?"
> **Blind:** "Sì! Milan! Forza!" *(grins, nothing else)*
> **Aldo:** "Buona partita, forza Milan!"

The blind player got through fine but never felt they'd met anyone. With a
richer step-2 prompt the same exchange might be: *"Quella maglia l'ho vista
in campo nel '94 — Savicevic, tre gol al Barça. Serata indimenticabile."* —
suddenly Aldo is a person with a memory, not a gate.

### anticipator — no surprise
> **Aldo:** "Buonasera! Il biglietto, per favore."
> **Anticipator:** "Buonasera! Ecco il biglietto."
> **Aldo:** "Bella maglia. Sei un tifoso vero, eh?"
> **Anticipator:** "Sì, sono tifoso del Milan!"
> **Aldo:** "Buona partita, forza Milan!"

Frictionless but forgettable. No moment to remember. A closing "in bocca al
lupo!" gives the sharp learner a mini-puzzle worth solving on the way in.

### offbeat — maxTurns wall
> **Aldo:** "Buonasera! Il biglietto, per favore."
> **Offbeat:** "Buonasera! Ecco... ma dov'è il settore B?"
> **Aldo:** "Settore B, curva sud — avanti!" *(handled well)*
> **Offbeat:** "Grazie! Quanti anni lavora qui?"
> *[maxTurns 3 hit — screen closes before Aldo can answer with "quarant'anni!"]*

The offbeat player's most natural question for a warmhearted elderly booth
man — and the one that would make Aldo *real* — hits the hard turn cap. The
bump to maxTurns 5 gives that exchange room without changing the scene's
transactional nature.

## Script changes (applied)
- **Arc step 2:** Tightened to weight toward a real Aldo memory or specific
  stadium observation. Added three concrete example lines (a historical match
  moment, a jersey/scarf detail, a stadium fact) so the model reaches for
  vivid material rather than defaulting to "Bella maglia!" or weather.
  *(See `// playtest-findings/sanSiroEntry.md — step 2 enrichment`)*
- **Arc step 3 (congedo):** Added "in bocca al lupo, ragazzo mio!" as Aldo's
  closing ritual. One warm attempt; if the player says "crepi!" Aldo
  celebrates; if not, he says it lightly and closes — never nags, never
  blocks. Matches the navigliLive sign-off pattern.
  *(See `// playtest-findings/sanSiroEntry.md — lupo sign-off`)*
- **whisperHints:** Reordered to positional indices (greeting → ticket →
  comment → lupo → farewell) to match the navigliLive pattern for when
  LiveConversationScreen hooks them in.
- **maxTurns:** 3 → 5. Three Aldo turns remain the arc spine; 5 gives
  breathing room for fumbles and the lupo exchange.
