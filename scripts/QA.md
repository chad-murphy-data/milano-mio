# QA agent — conversational runbook

This is a runbook for **Claude in chat** (i.e., a future session of me).
The user wants to drive QA conversationally — they say things like
"run a QA pass on caffè" and expect Claude to invoke the right
subcommand, read the output, summarize findings, propose specific
edits, and apply approved ones via the `Edit` tool.

The pipeline lives at [`scripts/qa-pipeline.mjs`](./qa-pipeline.mjs).
The default workflow **never auto-edits source files**: the Programmer
Agent writes a markdown proposal that Claude reads and discusses with
the user. The user approves specific edits; Claude applies them via
the `Edit` tool, NOT via the script's writeFileSync.

## Quick reference — what to invoke when

| User says…                                                | Run                                                       |
| --------------------------------------------------------- | --------------------------------------------------------- |
| "run a QA pass on caffè"                                  | `node scripts/qa-pipeline.mjs propose caffeLive`          |
| "QA the metro scenario"                                   | `node scripts/qa-pipeline.mjs propose metroLive`          |
| "just simulate hotel — don't analyze"                     | `node scripts/qa-pipeline.mjs simulate hotelLive`         |
| "re-analyze the cached caffè run"                         | `node scripts/qa-pipeline.mjs analyze caffeLive`          |
| "analyze the real sessions for caffè"                     | `analyze caffeLive --from=real:./mm-qa-sessions-*.json`   |
| "apply the edits we just discussed"                       | use the `Edit` tool directly — NOT the script             |
| "let the agent apply edits itself" (rare; opt-in)         | `node scripts/qa-pipeline.mjs apply caffeLive`            |
| "run QA on everything"                                    | `node scripts/qa-pipeline.mjs all`                        |

## The default loop

1. **Propose.** Run `propose <scenarioId>`. The script will simulate
   (if no cached transcript), analyze (if no cached findings), and
   write `scripts/qa-findings/<id>.proposal.md`.
2. **Read the proposal.** Use the `Read` tool on the proposal file.
   The structure is:
   - Summary (grade, phrase utilization, completion)
   - Sidebar phrases not used by Obedient Chad
   - Issues flagged by the analyzer
   - Programmer Agent rationale
   - One section per proposed edit with exact before/after snippets
3. **Summarize for the user.** Don't dump the proposal verbatim — pick
   out the 1–3 most important findings and the 1–3 edits you'd
   recommend. Quote the rationale briefly. Flag any edit whose
   `Find` block is marked `⚠️ target string not found` — those won't
   apply cleanly.
4. **Wait for approval.** Ask which edits to apply. Don't assume.
5. **Apply selectively.** Use the `Edit` tool on `src/data/<file>.js`
   with the `old_string` / `new_string` from the approved edit
   sections. Do NOT run `apply` — that bypasses the review step.
6. **Verify.** Run `npm run build` and confirm no errors.

## Ingesting real Gemini Live sessions

The runtime `LiveConversationScreen.jsx` captures every finished
session to `localStorage` under `mm_qa_sessions:<scenarioId>`
(20-entry FIFO). To analyze them:

1. Tell the user to open the dev build (`npm run dev`), do at least
   one Caffè conversation, click **Export QA bundle** on the home
   screen — this downloads `mm-qa-sessions-<timestamp>.json`.
2. Have them paste the file path in chat.
3. Run `analyze <id> --from=real:<path>`. It picks the most recent
   matching session and runs the same `analyzeRun` pipeline that
   synthetic transcripts go through.
4. Then `propose <id>` will use those real findings.

The QA Export button is gated on `import.meta.env.DEV` — it does not
appear in production builds.

## What NOT to do

- **Don't run `apply` without explicit user approval of every edit.**
  The user picked "print diff only — human applies" — auto-apply is
  for the rare case where they explicitly opt in for one run.
- **Don't propose changes the user didn't ask about.** If they ask for
  phrase-utilization improvements, don't also try to fix character
  voice or rewrite the arc.
- **Don't mass-run `all`** unless they ask. Each location costs ~40
  Anthropic API calls.
- **Don't edit `scripts/qa-pipeline.mjs` to silence warnings about
  unfound edit targets.** Those warnings indicate the Programmer Agent
  hallucinated a string that's not in the file — surface them to the
  user instead.

## Available scenarios

`hotelLive`, `caffeLive`, `metroLive`, `duomoLive`, `mercatoLive`,
`trattoriaLive`, `navigliLive`, `viaDellaSpigasLive`, `casaMilanLive`,
`bartoliniLive`, `bartoliniSommelierLive`, `sanSiroVendorLive`,
`sanSiroMatchLive`, `sanSiroEntry`, `gabriellaApartment`.

## File layout

- `scripts/qa-pipeline.mjs` — the pipeline; subcommand dispatcher at the bottom.
- `scripts/qa-findings/<id>.transcripts.json` — cached simulation output.
- `scripts/qa-findings/<id>.json` — cached findings (existing schema).
- `scripts/qa-findings/<id>.proposal.md` — markdown proposal Claude reads.
- `scripts/QA.md` — this file.
