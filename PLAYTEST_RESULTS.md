# Milano Mio — Playtest Results (2026-06-07)

Blind playthroughs (no phrase cheat-sheet) judged for **Fun** and
**Friction**, then each script reworked. Method + agents:
[`scripts/PLAYTEST.md`](scripts/PLAYTEST.md). Per-scene reports:
[`scripts/playtest-findings/`](scripts/playtest-findings/).

> Why this exists: the older `qa-pipeline.mjs` graded conversations on
> completion + phrase use and handed the player the full phrase list — it
> can't feel friction. It graded **Navigli an "A"** while the scene was a
> slog. This pass sends players in blind and scores the *experience*.

Scores are estimates from the in-session blind playtest (this environment
has no API key; re-run `node scripts/playtest.mjs all` with a key to
reproduce). Higher Fun = better; higher Friction = worse.

**Headline: avg Fun 5.7 → 7.8 · avg Friction 6.3 → 2.8.**

## Leaderboard (worst friction first, before → after)

| Scene | Character | Fun | Friction | The core fix |
|---|---|---:|---:|---|
| navigli | Sofia | 4 → 8 | 8 → 2 | Cut single-voice Luca/Marta cameo; forced march → beat sheet; "crepi" moved to the sign-off |
| duomo | Francesca | 5 → 8 | 8 → 3 | Cut Alberto voice-swap (a prior "fix" was comment-only); loosened the march |
| metro | Davide | 6 → 7 | 7 → 4 | "cambiare" made conditional; merged a 3-question small-talk quiz into one beat |
| trattoria | Lorenzo | 6 → 8 | 7 → 3 | Loosened the march; gave Lorenzo his food-passion payoff; de-stuffed the bill turn |
| via della Spiga | Valentina | 5 → 7 | 7 → 3 | Loosened the march (it skipped the price every time); added a gift-buyer fork |
| Casa Milan | Paolo | 5 → 8 | 7 → 3 | Cut a hidden single-voice Napoli-fan cameo; removed a football-vocab gate |
| Bartolini sommelier | Elena | 5 → 7 | 7 → 3 | Loosened the wine-tasting checklist; added an insider reveal; real closing button |
| San Siro vendor | Vendor | 6 → 8 | 7 → 3 | Loosened the march; nagged "crepi" gate → one-shot sign-off (+ anticipator path) |
| San Siro match | Giuseppe | 6 → 8 | 7 → 4 | Merged 5 rigid match-narration beats; added a personal memory; "crepi" sign-off |
| mercato | Rosa | 6 → 8 | 6 → 3 | Dropped the "insisti" taste-test nag; surfaced the family-stall history |
| Bartolini | Alessandro | 6 → 8 | 6 → 2 | Split a triple-loaded beat so the insider detail lands; fixed a singular/plural leak |
| Gabriella | Gabriella | 6 → 8 | 6 → 3 | Kept her tutor role; let the review breathe; removed a quiz-like word-count announce |
| hotel | Giulia | 7 → 8 | 4 → 2 | Whisper-hint desync; companion-mention handling; payoff made non-optional |
| San Siro entry | Nonno Aldo | 6 → 8 | 4 → 2 | Concrete Aldo-as-person lines; "crepi" sign-off; maxTurns 3 → 5 so it isn't cut off |
| caffè | Marco | 7 → 8 | 4 → 2 | Removed a hardcoded "signora" assumption; killed scripted price-pause dead air |

## Recurring patterns (the systemic findings)

1. **The forced march.** Almost every scene had a line like *"UN PASSO PER
   TURNO. Avanza sempre al passo successivo."* buried in the arc. It
   overrides everything above it and railroads any player who answers
   off-script — the single biggest friction source. Fix: a loose beat
   sheet headed by *"l'ospite viene PRIMA del copione / SEGUI L'UTENTE."*
2. **One voice, several people.** navigli (Luca/Marta), duomo (Alberto),
   Casa Milan (a Napoli fan) each had a cameo voiced through the host's
   single Live voice — the learner can't tell who's talking. All cut/folded
   into the host.
3. **Nagged call-and-response / vocab gates.** "You must say *crepi*!",
   "insisti", forced football terms. Made optional delights — and where a
   call-and-response is genuinely fun (crepi), moved to the **sign-off** as
   a closing button (per Chad's note that it was fun, just forced mid-scene).
4. **Tacked-on exit quizzes.** "Dove andate adesso?" + a big lookup table,
   fired as a mandatory final step. Kept warm but optional.
5. **Comment-only "fixes."** Several files had a header claiming a rework
   that never touched the prompt body (duomo, trattoria, mercato). The
   blind playtest catches these because it reads the *behavior*, not the
   comment.
6. **Missing payoff.** Most scenes marched through tasks with no human
   moment. Added one "let me tell you something" beat each (a Milan secret,
   a family story, a stadium memory, an insider wine note).

## Reproduce / iterate

```bash
ANTHROPIC_API_KEY=sk-ant-... node scripts/playtest.mjs all          # leaderboard
node scripts/playtest.mjs playtest navigliLive --verbose            # one scene, see every turn
node scripts/playtest.mjs rewrite duomoLive                         # propose more edits
```
