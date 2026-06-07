# Playtest agents — fun & friction, not phrase-bingo

This is the sibling of [`QA.md`](./QA.md), for a different question.
`qa-pipeline.mjs` asks *"can the conversation be completed and did the
learner use the key phrases?"* — it hands "Chad" the full phrase list, so
it grades **mechanics**. It once graded Navigli an **A** while the human
who played it found it tedious. That's the gap this tool closes.

`playtest.mjs` asks *"is this scene actually fun to play, and does it
roll with a real person?"* Players go in **blind** — no phrase cheat
sheet — and a Critic agent scores **Fun** and **Friction**.

## The agents

| Agent | Role |
| --- | --- |
| **Character** | the scenario's own `buildSystemPrompt()` — the script under test, unchanged |
| **Player · blind** | a lost first-timer who flails like a real tourist |
| **Player · anticipator** | a sharp learner who tries to guess the "right" line |
| **Player · offbeat** | answers ~10% off the expected beat (naturally) — stress-tests railroading |
| **Critic** | scores Fun/Friction; flags railroading, repetition, confusion, forced beats, pacing |
| **Playwright** | turns Critic notes into targeted `old/new` script edits, preserving voice |

The three players share one rule: **they never see the key phrases or the
arc.** They only get what the real `LiveConversationScreen` shows
mid-conversation — the character's spoken line and the positional
`(psst… …)` whisper hint (`whisperHints[turn]`, clamped). That's why they
can feel the friction a cheat-sheet agent can't.

## Quick reference

| You say… | Run |
| --- | --- |
| "playtest navigli" | `node scripts/playtest.mjs playtest navigliLive` |
| "what's the worst scene?" | `node scripts/playtest.mjs all` → read `PLAYTEST_RESULTS.md` |
| "propose a rewrite for navigli" | `node scripts/playtest.mjs rewrite navigliLive` |
| "just blind + offbeat, no anticipator" | `... playtest navigliLive --personas=blind,offbeat` |
| "let the agent apply edits itself" (opt-in) | `node scripts/playtest.mjs apply navigliLive` |

## The default loop

1. **Playtest.** `playtest <id>` runs the three blind players against the
   character, then the Critic, and writes:
   - `scripts/playtest-findings/<id>.md` — verdict, Fun/Friction, top
     issues, railroading/repetition/confusion/forced-beats, and the three
     transcripts.
   - `scripts/playtest-findings/<id>.transcripts.json` — raw runs.
2. **Read the findings.** Lead with Fun/Friction and the top 1-4 issues.
   The transcripts are the evidence — quote the turn where it broke.
3. **Rewrite.** `rewrite <id>` runs the Playwright and writes
   `scripts/playtest-findings/<id>.proposal.md` with targeted `old/new`
   edits. **No source files are touched.** Edits whose `Find` block is
   flagged `⚠️ target string not found` won't apply cleanly — surface them.
4. **Apply.** Either hand the proposal edits to Claude to apply via the
   `Edit` tool after review (preferred — keeps a human in the loop), or
   `apply <id>` to let the script write them directly (opt-in).
5. **Verify.** `npm run build`, then re-`playtest` to confirm Fun went up
   and Friction down.

## What "friction" looks like (read these in transcripts)

- **Railroading** — the character ignores the offbeat player's answer and
  forces its next scripted beat. Most visible in the `offbeat` run.
- **Repetition / padding** — the same question/beat recurs; filler turns;
  the "even the AI got bored" mode (see the comment in `navigliLive.js`).
- **Confusion** — unsignalled character switches (one voice playing two
  people), ambiguous questions, abrupt topic jumps.
- **Forced beats / dead-ends** — call-and-response the character *nags*
  about; quiz-like demands; non-sequitur endings ("Dove andate adesso?").
- **Pacing** — arc too long for its substance, or anticlimactic.

## Fidelity caveat

Most scenarios run on **Gemini Live** in production, but — exactly like
`qa-pipeline.mjs` — we exercise the **script** (`buildSystemPrompt`) with
Claude voicing the character. The script is the artifact we iterate on, so
it's the right surface to test. Prompts are built at difficulty `facile`,
the default `LiveConversationScreen` passes.

## Cost

Each `playtest <id>` is ~3 playthroughs × ~10 turns × 2 calls + 1 Critic
call ≈ 60+ Anthropic calls. `all` multiplies that by 15 — run it
deliberately.

## Files

- `scripts/playtest.mjs` — the pipeline.
- `scripts/playtest-findings/<id>.md` — per-scenario fun/friction report.
- `scripts/playtest-findings/<id>.transcripts.json` — raw playthroughs.
- `scripts/playtest-findings/<id>.proposal.md` — Playwright edit proposal.
- `PLAYTEST_RESULTS.md` — top-level leaderboard from `all`.
