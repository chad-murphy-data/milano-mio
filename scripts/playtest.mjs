#!/usr/bin/env node

// Milano Mio — Conversation Playtest Pipeline
// =====================================================================
// A second-generation QA harness focused on FUN and FRICTION rather than
// phrase-bingo. Where scripts/qa-pipeline.mjs hands "Chad" the full
// key-phrase cheat sheet and grades on completion + phrase utilization,
// this harness sends players in BLIND — they only know what a real
// learner knows mid-conversation (the scene, the opening hint, and the
// positional "psst…" whisper hint) — and then a Critic agent judges
// whether the script is actually enjoyable to play through.
//
// Why a separate tool? qa-pipeline graded Navigli an "A" while the human
// who played it found it tedious and hard to get through. The metric was
// wrong: an agent that already knows every line can't feel friction. This
// harness closes that gap.
//
// THE AGENTS
//   1. Character  — the scenario's own buildSystemPrompt(), unchanged.
//                   This is the script under test.
//   2. Player     — three personas, NONE of which see the key-phrase list
//                   or the conversation arc:
//        • blind       a real first-timer; flails like an actual tourist
//        • anticipator a sharp learner who tries to guess the "right" line
//        • offbeat     answers ~10% off the expected beat, but naturally —
//                      stress-tests whether the script can roll with
//                      ordinary conversational variation or railroads.
//   3. Critic     — reads the transcripts and scores Fun / Friction,
//                   flags railroading, confusion, dead-ends, repetition,
//                   and the "even the AI got bored" failure mode.
//   4. Playwright — turns the Critic's notes into TARGETED script edits
//                   (old/new), preserving the character's voice.
//
// FIDELITY NOTE
//   Several scenarios run on Gemini Live in production, but — exactly like
//   qa-pipeline — we exercise the SCRIPT (buildSystemPrompt) with Claude
//   voicing the character. The artifact we iterate on is the script, so
//   this is the right surface to test. We build the prompt at difficulty
//   'facile', which is the default LiveConversationScreen passes.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/playtest.mjs <command> <id> [flags]
//
// Commands:
//   playtest <id>   Run blind+anticipator+offbeat vs the character, then
//                   the Critic. Writes scripts/playtest-findings/<id>.md
//                   and <id>.transcripts.json. NO source writes.
//   rewrite  <id>   Playwright proposes targeted edits → <id>.proposal.md.
//                   NO source writes.
//   apply    <id>   OPT-IN: write the Playwright's edits into src/data/<file>.
//   all             Playtest every scenario, write PLAYTEST_RESULTS.md.
//
// Flags:
//   --personas=blind,offbeat   Subset of personas (default all three)
//   --difficulty=facile        Prompt difficulty (default facile)
//   --model=claude-...         Override the sim/critic model
//   --verbose                  Log every turn

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const FINDINGS_DIR = resolve(__dirname, 'playtest-findings');
mkdirSync(FINDINGS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith('--'));
const subcommand = positional[0];
const subcommandId = positional[1];
const flagPersonas = args.find(a => a.startsWith('--personas='))?.split('=')[1];
const flagDifficulty = args.find(a => a.startsWith('--difficulty='))?.split('=')[1] || 'facile';
const flagModel = args.find(a => a.startsWith('--model='))?.split('=')[1];
const verbose = args.includes('--verbose');

const SIM_MODEL = flagModel || 'claude-sonnet-4-6';
const CRITIC_MODEL = flagModel || 'claude-sonnet-4-6';

const PERSONAS = flagPersonas
  ? flagPersonas.split(',').map(s => s.trim()).filter(Boolean)
  : ['blind', 'anticipator', 'offbeat'];

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set ANTHROPIC_API_KEY environment variable.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Location registry (mirrors scenarios.js + qa-pipeline.mjs).
// Kept in sync by hand; this is the same 15-scenario set the app ships.
// ---------------------------------------------------------------------------
const LOCATIONS = [
  { id: 'hotelLive', file: 'hotelLive.js', charName: 'Giulia',
    stageDirection: '[Chad arrives at the hotel reception desk with luggage. Giulia is finishing a phone call.]' },
  { id: 'caffeLive', file: 'caffeLive.js', charName: 'Marco',
    stageDirection: '[Chad walks up to the bar. Marco is pulling shots.]' },
  { id: 'metroLive', file: 'metroLive.js', charName: 'Davide',
    stageDirection: '[Chad is standing at a ticket machine in Cadorna metro station. Davide notices and offers to help.]' },
  { id: 'duomoLive', file: 'duomoLive.js', charName: 'Francesca',
    stageDirection: '[Chad approaches the tourist information point in Piazza del Duomo. Francesca welcomes him.]' },
  { id: 'mercatoLive', file: 'mercatoLive.js', charName: 'Rosa',
    stageDirection: "[Chad approaches Rosa's market stall on a weekday morning. Rosa beams.]" },
  { id: 'trattoriaLive', file: 'trattoriaLive.js', charName: 'Lorenzo',
    stageDirection: '[Chad arrives at the trattoria entrance for their dinner reservation. Lorenzo greets them at the door.]' },
  { id: 'navigliLive', file: 'navigliLive.js', charName: 'Sofia',
    stageDirection: '[Chad sits down at a canal-side table at a bar in the Navigli district. Sofia approaches with a warm welcome.]' },
  { id: 'viaDellaSpigasLive', file: 'viaDellaSpigasLive.js', charName: 'Valentina',
    stageDirection: '[Chad enters an elegant boutique on Via della Spiga. Valentina greets him from a display near the entrance.]' },
  { id: 'casaMilanLive', file: 'casaMilanLive.js', charName: 'Paolo',
    stageDirection: '[Chad enters Casa Milan. Paolo is arranging jerseys near the entrance and lights up at a fellow fan.]' },
  { id: 'bartoliniLive', file: 'bartoliniLive.js', charName: 'Alessandro',
    stageDirection: '[Chad arrives at Enrico Bartolini al MUDEC. Alessandro greets him at the podium with measured warmth.]' },
  { id: 'bartoliniSommelierLive', file: 'bartoliniSommelierLive.js', charName: 'Elena',
    stageDirection: '[Elena, the sommelier, arrives at the table to begin the wine pairing.]' },
  { id: 'sanSiroVendorLive', file: 'sanSiroVendorLive.js', charName: 'Vendor',
    stageDirection: '[Chad approaches a scarf-and-program vendor outside San Siro on match day, half an hour before kickoff.]' },
  { id: 'sanSiroMatchLive', file: 'sanSiroMatchLive.js', charName: 'Giuseppe',
    stageDirection: '[Chad has just sat down in the San Siro stands. Giuseppe drops into the seat next to him as the match begins.]' },
  { id: 'sanSiroEntry', file: 'sanSiroEntry.js', charName: 'Nonno Aldo',
    stageDirection: '[Chad arrives at the San Siro biglietteria booth, ticket in hand.]' },
  { id: 'gabriellaApartment', file: 'gabriellaApartment.js', charName: 'Gabriella',
    stageDirection: "[Chad arrives at Gabriella's apartment for an afternoon visit.]" },
];

// ---------------------------------------------------------------------------
// Response parser (mirrors debriefParser.js / qa-pipeline.mjs)
// ---------------------------------------------------------------------------
function tryParseJSON(raw) {
  try { return JSON.parse(raw); } catch {
    try { return JSON.parse(raw.replace(/,(\s*[}\]])/g, '$1')); } catch { return null; }
  }
}

function parseCharacterResponse(text) {
  let t = text;
  const memMatch = t.match(/\[CHARACTER_MEMORY\]([\s\S]*?)\[\/CHARACTER_MEMORY\]/);
  if (memMatch) t = t.replace(memMatch[0], '').trim();
  const hintMatch = t.match(/\[HINT:\s*(.+?)\]/);
  const hint = hintMatch ? hintMatch[1].trim() : null;
  if (hintMatch) t = t.replace(hintMatch[0], '').trim();
  const engMatch = t.match(/\[ENGLISH:\s*([\s\S]*?)\]/);
  if (engMatch) t = t.replace(engMatch[0], '').trim();
  const debMatch = t.match(/\[DEBRIEF\]([\s\S]*?)\[\/DEBRIEF\]/);
  const debrief = debMatch ? tryParseJSON(debMatch[1].trim()) : null;
  if (debMatch) t = t.replace(debMatch[0], '').trim();
  return { spoken: t.trim(), debrief, hint };
}

// ---------------------------------------------------------------------------
// Anthropic API caller with retry + rate limiting (mirrors qa-pipeline.mjs)
// ---------------------------------------------------------------------------
let lastCallTime = 0;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callClaude(systemPrompt, messages, { model = SIM_MODEL, maxTokens = 600 } = {}) {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastCallTime));
  if (wait > 0) await sleep(wait);
  lastCallTime = Date.now();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
        console.log(`  Rate limited, waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    } catch (err) {
      if (attempt < 2) { console.log(`  Retry ${attempt + 1}: ${err.message}`); await sleep(2000); }
      else throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Live end-of-conversation detection (mirrors LiveConversationScreen.jsx)
// ---------------------------------------------------------------------------
const FAREWELL_RE = /\b(arrivederci|alla\s+prossima|a\s+presto|a\s+domani|buon\s+riposo|buon\s+proseguimento|buon\s+pomeriggio|buon\s+appetito|buon\s+viaggio|buona\s+giornata|buona\s+serata|buona\s+partita|buona\s+cena|buona\s+spesa|forza\s+milan|ci\s+vediamo)\b/i;
const TRAILING_CIAO_RE = /\bciao(\s+ciao)?[\s!.?]*$/i;
function isFarewellLine(text) {
  if (!text) return false;
  if (FAREWELL_RE.test(text)) return true;
  if (TRAILING_CIAO_RE.test(text.trim())) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Dynamic location loader (cache-busted so re-runs pick up edits)
// ---------------------------------------------------------------------------
async function loadLocation(loc) {
  const cacheBust = `?t=${Date.now()}`;
  const mod = await import(`file://${resolve(DATA_DIR, loc.file).replace(/\\/g, '/')}${cacheBust}`);
  return {
    ...loc,
    scenario: mod.scenario,
    keyPhrases: mod.keyPhrases || [],
    coreVocab: mod.coreVocab || [],
    whisperHints: mod.whisperHints || [],
    buildSystemPrompt: mod.buildSystemPrompt,
  };
}

// ---------------------------------------------------------------------------
// Player personas — the heart of the difference from qa-pipeline.
// CRITICAL: players never receive keyPhrases or the conversation arc.
// They only know what a real learner knows mid-conversation.
// ---------------------------------------------------------------------------
const PLAYER_BASE = `You are Chad, a warm, enthusiastic American tourist in Milan with your wife Charlie. It is your FIRST time in Italy. You did not study for this.

WHAT YOU ACTUALLY KNOW: a handful of survival words — ciao, grazie, sì, no, per favore, scusi, buongiorno, buonasera, prego — plus whatever you can guess from English or your high-school Spanish, and whatever you can read off context. You do NOT have a script, a phrasebook, or a list of "correct" answers. You are improvising in real time like a real human in a foreign country.

HOW YOU BEHAVE:
- Keep replies SHORT — 1-2 sentences. You're a beginner, not giving speeches.
- Try Italian first, but fall back to a guessed cognate, a single English word, or a ~gesture~ when you're stuck. That's what real tourists do.
- React to what the character ACTUALLY just said — its tone, its question — not to some imagined script.
- Sometimes the app whispers a hint to you, shown as "(psst… …)". You MAY glance at it, but it won't always fit the moment, and you won't always bother.
- Ignore any bracketed metadata or ~tilde stage directions~ in the character's lines; those are scene-setting, not speech.
- You're having FUN and you want to keep the conversation flowing, but you genuinely don't know much Italian.`;

const PERSONA_OVERLAYS = {
  blind: `YOUR PERSONA — FIRST-TIMER, GENUINELY LOST:
You're eager but frequently confused. When you don't understand, do exactly what a real tourist does: say "scusi?", repeat a word back as a question, answer in English, point, laugh nervously, or take a wild guess. Do NOT magically produce the perfect Italian phrase you were never taught. If the character asks something you can't parse, it's realistic to stall or get it wrong.`,

  anticipator: `YOUR PERSONA — SHARP, ENGAGED LEARNER:
You're quick and socially fluent. You actively try to ANTICIPATE the expected Italian answer from context, body language, and pragmatics, and you produce your best good-faith guess at the "right" response to keep things smooth. You're still a beginner — your Italian is simple and sometimes wrong — but you're playing to win and reading the room well.`,

  offbeat: `YOUR PERSONA — NATURAL, BUT ~10% OFF THE EXPECTED BEAT:
You respond plausibly but deliberately a little off the obvious rail — answer a slightly different angle than asked, volunteer an unscripted but believable detail, pick an unexpected-but-reasonable option, or ask a natural follow-up question of your own. You are NOT a troll and NOT random — you're a real, curious traveler whose mind wanders the way real people's do. The goal is to see whether the character can gracefully roll with ordinary conversational variation, or whether it ignores you and railroads back to its script.`
};

function buildPlayerPrompt(persona) {
  return `${PLAYER_BASE}\n\n${PERSONA_OVERLAYS[persona] || PERSONA_OVERLAYS.blind}\n\nThe character speaks first. Respond as Chad.`;
}

// Positional whisper hint, exactly as LiveConversationScreen serves it:
// the hint at index = current turn, clamped to the last hint. This is the
// real scaffolding a learner sees — NOT the full phrase list.
function whisperForTurn(location, turnIdx) {
  const hints = location.whisperHints || [];
  if (!hints.length) return null;
  return hints[Math.min(turnIdx, hints.length - 1)]?.hint || null;
}

// ---------------------------------------------------------------------------
// Run one blind playthrough (character vs a single player persona)
// ---------------------------------------------------------------------------
async function runPlaytest(location, persona) {
  const systemPrompt = location.buildSystemPrompt(flagDifficulty);
  const playerPrompt = buildPlayerPrompt(persona);

  const charMessages = [];   // character's private context (holds the script)
  const playerMessages = []; // player's private context (blind)
  const transcript = [];
  let turnCount = 0;
  const MAX_TURNS = (location.scenario?.live?.maxTurns || 12) + 2;
  const farewellEnabled = !!location.scenario?.live;
  const farewellMinTurn = location.scenario?.live?.farewellMinTurn ?? 4;
  const recentCharLines = [];
  let debrief = null;
  let endedByFarewell = false;

  // Character opens.
  charMessages.push({ role: 'user', content: location.stageDirection });
  const firstRaw = await callClaude(systemPrompt, charMessages);
  charMessages.push({ role: 'assistant', content: firstRaw });
  const first = parseCharacterResponse(firstRaw);
  transcript.push({ turn: 0, speaker: location.charName, spoken: first.spoken });
  if (verbose) console.log(`  [${location.charName}]: ${first.spoken}`);
  if (first.debrief) return finish(true, false);
  recentCharLines.push(first.spoken.slice(0, 80));

  let lastCharSpoken = first.spoken;

  while (turnCount < MAX_TURNS && !debrief && !endedByFarewell) {
    turnCount++;

    // Player hears the character's last line + (maybe) the positional hint.
    const hint = whisperForTurn(location, turnCount);
    const heard = hint ? `${lastCharSpoken}\n\n(psst… ${hint})` : lastCharSpoken;
    playerMessages.push({ role: 'user', content: heard });
    const playerReply = await callClaude(playerPrompt, playerMessages);
    playerMessages.push({ role: 'assistant', content: playerReply });
    transcript.push({ turn: turnCount, speaker: 'Chad', spoken: playerReply });
    if (verbose) console.log(`  [Chad/${persona}]: ${playerReply}`);

    // Character responds.
    charMessages.push({ role: 'user', content: playerReply });
    const charRaw = await callClaude(systemPrompt, charMessages);
    charMessages.push({ role: 'assistant', content: charRaw });
    const parsed = parseCharacterResponse(charRaw);
    transcript.push({ turn: turnCount, speaker: location.charName, spoken: parsed.spoken });
    if (verbose) console.log(`  [${location.charName}]: ${parsed.spoken}`);
    lastCharSpoken = parsed.spoken;

    if (parsed.debrief) { debrief = parsed.debrief; break; }
    if (farewellEnabled && turnCount >= farewellMinTurn && isFarewellLine(parsed.spoken)) {
      endedByFarewell = true; break;
    }
    recentCharLines.push(parsed.spoken.slice(0, 80));
    if (recentCharLines.length >= 3) {
      const l3 = recentCharLines.slice(-3);
      if (l3[0] === l3[1] && l3[1] === l3[2]) { if (verbose) console.log('  STALL: char repeating 3x'); break; }
    }
  }

  function finish(completed, farewell) {
    return { persona, completed, turnCount, transcript, debrief, endedByFarewell: farewell, stalled: !completed && !farewell };
  }
  return finish(!!debrief || endedByFarewell, endedByFarewell);
}

// ---------------------------------------------------------------------------
// Critic agent — judges FUN and FRICTION, not phrase utilization.
// ---------------------------------------------------------------------------
function transcriptToText(t) {
  return t.map(l => `T${l.turn} ${l.speaker}: ${l.spoken}`).join('\n');
}

async function critique(location, runs) {
  const blocks = runs.map(r =>
    `### Persona: ${r.persona} (${r.completed ? 'completed' : 'did NOT complete'}, ${r.turnCount} turns${r.endedByFarewell ? ', farewell' : ''}${r.stalled ? ', STALLED' : ''})\n${transcriptToText(r.transcript)}`
  ).join('\n\n');

  const system = `You are a sharp, experienced game/conversation designer reviewing a scene from "Milano Mio", a conversational Italian-learning app. A learner is dropped into a Milan location and talks (in halting Italian) with a local character voiced by an LLM from a hidden system-prompt "script". Your job is to judge whether the scene is FUN and SMOOTH to play through — not whether the learner used specific vocabulary.

You are given transcripts from three blind playthroughs (the players could NOT see the script or a phrase list — only what the app shows mid-conversation). Players: "blind" (a lost first-timer), "anticipator" (tries to guess the right line), "offbeat" (answers ~10% off the expected beat, to test flexibility).

Judge the SCRIPT, not the players. Look hard for:
- RAILROADING: the character ignores what the player said and forces its next scripted beat anyway (most visible in the offbeat run).
- REPETITION / PADDING: the same beat or question recurs; filler turns; the "even the AI got bored" failure mode.
- CONFUSION: unsignalled character switches, ambiguous questions, abrupt topic jumps, beats the player clearly couldn't follow.
- DEAD-ENDS / FORCED BEATS: call-and-response the character nags about; quiz-like demands; non-sequitur endings.
- PACING: too long, too short, front-loaded, anticlimactic.
- WARMTH & PAYOFF: does the character feel like a person? Is there a satisfying button at the end?

Output STRICT JSON, no prose, no code fences:
{
  "funScore": <1-10, higher = more enjoyable>,
  "frictionScore": <1-10, higher = MORE friction (worse)>,
  "oneLineVerdict": "<=120 chars",
  "strengths": ["..."],
  "railroading": [{"turn": <n>, "what": "player said X, character forced Y"}],
  "repetition": ["..."],
  "confusion": ["..."],
  "forcedBeats": ["..."],
  "pacing": "<short note>",
  "topIssues": ["the 1-4 things most worth fixing, most important first"],
  "scriptSuggestions": ["concrete, specific changes to the system prompt / arc / hints — what to cut, merge, soften, or add"]
}`;

  const user = `SCENARIO: ${location.id} — character ${location.charName}, title "${location.scenario?.title || ''}".
maxTurns in script: ${location.scenario?.live?.maxTurns ?? 'n/a'}.

THE SCRIPT UNDER TEST (the character's hidden system prompt):
"""
${location.buildSystemPrompt(flagDifficulty)}
"""

PLAYTHROUGHS:
${blocks}

Return ONLY the JSON.`;

  const raw = await callClaude(system, [{ role: 'user', content: user }], { model: CRITIC_MODEL, maxTokens: 1600 });
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? tryParseJSON(match[0]) : null;
  return parsed || { funScore: null, frictionScore: null, oneLineVerdict: 'Critic parse failed', raw };
}

// ---------------------------------------------------------------------------
// Playwright agent — turns critique into TARGETED edits (old/new).
// ---------------------------------------------------------------------------
async function playwright(location, critique) {
  const filePath = resolve(DATA_DIR, location.file);
  const fileContent = readFileSync(filePath, 'utf-8');

  const system = `You are a playwright + senior engineer improving a Milano Mio scenario file (character: ${location.charName}, id: ${location.id}). You receive a Critic's fun/friction findings and must propose TARGETED edits that make the scene more fun and less railroaded WITHOUT changing the character's identity or breaking the file.

HARD RULES:
- Output a JSON array of surgical edits; each {"old": <exact substring of the file>, "new": <replacement>}. "old" MUST appear verbatim in the file.
- NEVER rename or remove exports (scenario, keyPhrases, coreVocab, extendedVocab, whisperHints, buildSystemPrompt). Keep it valid JS.
- NEVER change the character's name, gender, or core personality.
- Prefer editing the ARC steps, pacing rules, maxTurns, whisperHints, and forced beats — that's where friction lives.
- It's fine to CUT padding, MERGE redundant beats, SOFTEN nagging/forced call-and-response into optional moments, and let the character ACKNOWLEDGE off-script answers before moving on.
- Keep cultural/linguistic accuracy. Keep the same tone/voice in any prose you add.
- Make the smallest set of edits that meaningfully fixes the Critic's top issues. Don't gold-plate.

OUTPUT STRICT JSON only:
{ "edits": [ {"old": "...", "new": "..."} ], "explanation": "what you changed and why, in 2-5 sentences" }
If nothing needs changing: { "edits": [], "explanation": "No fixes needed" }`;

  const user = `CRITIC FINDINGS:
${JSON.stringify(critique, null, 2)}

CURRENT FILE (${location.file}):
\`\`\`javascript
${fileContent}
\`\`\`

Produce the JSON now.`;

  const raw = await callClaude(system, [{ role: 'user', content: user }], { maxTokens: 2400 });
  const match = raw.match(/\{[\s\S]*\}/);
  const obj = match ? tryParseJSON(match[0]) : null;
  if (!obj) return { edits: [], explanation: 'Playwright parse failed', fileContent, filePath };
  return { edits: obj.edits || [], explanation: obj.explanation || '', fileContent, filePath };
}

// ---------------------------------------------------------------------------
// Report writers
// ---------------------------------------------------------------------------
function findingsMdPath(id) { return resolve(FINDINGS_DIR, `${id}.md`); }
function transcriptsPath(id) { return resolve(FINDINGS_DIR, `${id}.transcripts.json`); }
function proposalPath(id) { return resolve(FINDINGS_DIR, `${id}.proposal.md`); }

function writeFindingsMd(location, runs, crit) {
  const lines = [];
  lines.push(`# Playtest — ${location.id} (${location.charName})`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Verdict');
  lines.push(`- **Fun:** ${crit.funScore ?? '?'}/10   **Friction:** ${crit.frictionScore ?? '?'}/10 (higher = worse)`);
  lines.push(`- ${crit.oneLineVerdict || ''}`);
  lines.push('');
  const fmt = (title, arr) => {
    if (!arr || !arr.length) return;
    lines.push(`## ${title}`);
    for (const x of arr) lines.push(`- ${typeof x === 'string' ? x : JSON.stringify(x)}`);
    lines.push('');
  };
  fmt('Top issues', crit.topIssues);
  fmt('Railroading', crit.railroading);
  fmt('Repetition / padding', crit.repetition);
  fmt('Confusion', crit.confusion);
  fmt('Forced beats', crit.forcedBeats);
  if (crit.pacing) { lines.push('## Pacing'); lines.push(crit.pacing); lines.push(''); }
  fmt('Strengths', crit.strengths);
  fmt('Script suggestions', crit.scriptSuggestions);
  lines.push('## Playthroughs (blind)');
  for (const r of runs) {
    lines.push('');
    lines.push(`### ${r.persona} — ${r.completed ? 'completed' : 'incomplete'}, ${r.turnCount} turns${r.stalled ? ' (STALLED)' : ''}`);
    lines.push('```');
    lines.push(transcriptToText(r.transcript));
    lines.push('```');
  }
  writeFileSync(findingsMdPath(location.id), lines.join('\n'), 'utf-8');
}

function writeProposalMd(location, crit, pw) {
  const lines = [];
  lines.push(`# Playtest rewrite proposal — ${location.id} (${location.charName})`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Fun ${crit.funScore ?? '?'}/10 · Friction ${crit.frictionScore ?? '?'}/10. ${crit.oneLineVerdict || ''}`);
  lines.push('');
  lines.push('## Playwright rationale');
  lines.push(pw.explanation || '_(none)_');
  lines.push('');
  if (!pw.edits.length) {
    lines.push('## Proposed edits');
    lines.push('_None._');
  } else {
    lines.push(`## Proposed edits (${pw.edits.length})`);
    lines.push(`Apply with \`node scripts/playtest.mjs apply ${location.id}\`, or hand them to Claude to apply via the Edit tool after review.`);
    lines.push('');
    pw.edits.forEach((e, i) => {
      const ok = pw.fileContent.includes(e.old);
      lines.push(`### Edit ${i + 1}${ok ? '' : ' — ⚠️ target string not found'}`);
      lines.push('**Find:**'); lines.push('```'); lines.push(e.old); lines.push('```');
      lines.push('**Replace with:**'); lines.push('```'); lines.push(e.new); lines.push('```'); lines.push('');
    });
  }
  writeFileSync(proposalPath(location.id), lines.join('\n'), 'utf-8');
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
function findLocation(id) {
  const loc = LOCATIONS.find(l => l.id === id);
  if (!loc) { console.error(`Unknown scenario: ${id}\nAvailable: ${LOCATIONS.map(l => l.id).join(', ')}`); process.exit(1); }
  return loc;
}

async function cmdPlaytest(id) {
  const location = await loadLocation(findLocation(id));
  console.log(`\nPlaytesting ${id} (${location.charName}) — personas: ${PERSONAS.join(', ')}`);
  const runs = [];
  for (const persona of PERSONAS) {
    console.log(`  --- ${persona} ---`);
    const r = await runPlaytest(location, persona);
    console.log(`  ${r.completed ? 'completed' : 'INCOMPLETE'} in ${r.turnCount} turns${r.stalled ? ' (STALLED)' : ''}`);
    runs.push(r);
  }
  writeFileSync(transcriptsPath(id), JSON.stringify({ runs }, null, 2));
  console.log('  --- critic ---');
  const crit = await critique(location, runs);
  writeFindingsMd(location, runs, crit);
  console.log(`  Fun ${crit.funScore ?? '?'}/10 · Friction ${crit.frictionScore ?? '?'}/10 — ${crit.oneLineVerdict || ''}`);
  console.log(`  Wrote ${findingsMdPath(id)}`);
  return { crit, runs };
}

async function cmdRewrite(id) {
  const location = await loadLocation(findLocation(id));
  let crit, runs;
  if (existsSync(transcriptsPath(id))) {
    runs = JSON.parse(readFileSync(transcriptsPath(id), 'utf-8')).runs;
    crit = await critique(location, runs);
  } else {
    ({ crit, runs } = await cmdPlaytest(id));
  }
  console.log('  --- playwright ---');
  const pw = await playwright(location, crit);
  writeProposalMd(location, crit, pw);
  console.log(`  ${pw.edits.length} edit(s) proposed → ${proposalPath(id)} (no source files modified)`);
  return { crit, pw };
}

async function cmdApply(id) {
  const location = await loadLocation(findLocation(id));
  const { pw } = await cmdRewrite(id);
  if (!pw.edits.length) { console.log('  Nothing to apply.'); return; }
  let content = pw.fileContent, applied = 0;
  for (const e of pw.edits) {
    if (content.includes(e.old)) { content = content.replace(e.old, e.new); applied++; }
    else console.log(`  WARNING: edit target not found: "${e.old.slice(0, 70)}..."`);
  }
  if (applied) { writeFileSync(pw.filePath, content, 'utf-8'); console.log(`  Applied ${applied}/${pw.edits.length} edits to ${pw.filePath}`); }
}

async function cmdAll() {
  console.log(`\nMilano Mio Playtest — all ${LOCATIONS.length} scenarios\n`);
  const summary = [];
  for (const loc of LOCATIONS) {
    try {
      const { crit } = await cmdPlaytest(loc.id);
      summary.push({ id: loc.id, char: loc.charName, fun: crit.funScore, friction: crit.frictionScore, verdict: crit.oneLineVerdict, top: crit.topIssues || [] });
    } catch (err) {
      console.error(`  ERROR ${loc.id}: ${err.message}`);
      summary.push({ id: loc.id, char: loc.charName, error: err.message });
    }
  }
  summary.sort((a, b) => (b.friction ?? -1) - (a.friction ?? -1)); // worst friction first
  const lines = [`# Milano Mio — Playtest Results (${new Date().toISOString().split('T')[0]})`, '',
    'Blind playthroughs (no phrase cheat-sheet) judged for Fun & Friction. Sorted worst-friction first.', '',
    '| Scenario | Character | Fun | Friction | Verdict |', '|---|---|---|---|---|'];
  for (const s of summary) {
    if (s.error) { lines.push(`| ${s.id} | ${s.char} | — | — | ERROR: ${s.error} |`); continue; }
    lines.push(`| ${s.id} | ${s.char} | ${s.fun ?? '?'} | ${s.friction ?? '?'} | ${(s.verdict || '').replace(/\|/g, '/')} |`);
  }
  lines.push('', '## Top issues per scenario', '');
  for (const s of summary) {
    if (s.error) continue;
    lines.push(`### ${s.id} (${s.char}) — Fun ${s.fun ?? '?'}/Friction ${s.friction ?? '?'}`);
    for (const t of s.top) lines.push(`- ${t}`);
    lines.push('');
  }
  writeFileSync(resolve(ROOT, 'PLAYTEST_RESULTS.md'), lines.join('\n'), 'utf-8');
  console.log(`\nWrote PLAYTEST_RESULTS.md`);
}

function printUsage() {
  console.log(`
Milano Mio Playtest Pipeline

  node scripts/playtest.mjs <command> <scenarioId> [flags]

Commands:
  playtest <id>   Blind playthroughs (blind+anticipator+offbeat) + Critic → playtest-findings/<id>.md
  rewrite  <id>   Playwright proposes targeted edits → playtest-findings/<id>.proposal.md (no writes)
  apply    <id>   OPT-IN: write the Playwright's edits into src/data/<file>
  all             Playtest every scenario → PLAYTEST_RESULTS.md

Flags:
  --personas=blind,offbeat   Subset of personas (default: blind,anticipator,offbeat)
  --difficulty=facile        Prompt difficulty (default: facile — the Live screen default)
  --model=claude-...         Override sim/critic model (default: ${SIM_MODEL})
  --verbose                  Log every turn

Scenarios: ${LOCATIONS.map(l => l.id).join(', ')}
`);
}

async function main() {
  if (subcommand === 'playtest') { if (!subcommandId) return printUsage(); await cmdPlaytest(subcommandId); return; }
  if (subcommand === 'rewrite')  { if (!subcommandId) return printUsage(); await cmdRewrite(subcommandId); return; }
  if (subcommand === 'apply')    { if (!subcommandId) return printUsage(); await cmdApply(subcommandId); return; }
  if (subcommand === 'all')      { await cmdAll(); return; }
  printUsage();
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
