#!/usr/bin/env node

// Milano Mio — Automated Location QA Pipeline
// Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/qa-pipeline.mjs [--location=caffe] [--skip-fixes] [--verbose]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'src/data');
const FINDINGS_DIR = resolve(__dirname, 'qa-findings');
mkdirSync(FINDINGS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
// Subcommand syntax (preferred):
//   node qa-pipeline.mjs <command> <id> [flags]
// Legacy syntax (still works):
//   node qa-pipeline.mjs [--location=<id>] [--skip-fixes] [--verbose]
const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith('--'));
const subcommand = positional[0];           // 'simulate' | 'analyze' | 'propose' | 'apply' | 'run' | 'all' | undefined
const subcommandId = positional[1];         // scenario id for the per-location subcommands
const flagLocation = args.find(a => a.startsWith('--location='))?.split('=')[1];
const flagFrom = args.find(a => a.startsWith('--from='))?.split('=')[1]; // 'real:<path>' for analyze
const skipFixes = args.includes('--skip-fixes');
const verbose = args.includes('--verbose');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set ANTHROPIC_API_KEY environment variable.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Location registry (mirrors scenarios.js but for Node)
// ---------------------------------------------------------------------------
// Mirrors scenarios.js. Live-only: the Claude+TTS scenarios were dropped
// in commit 8334099, so the old hotel.js/caffe.js entries no longer exist.
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
// Response parser (mirrors debriefParser.js)
// ---------------------------------------------------------------------------
function tryParseJSON(raw) {
  try { return JSON.parse(raw); } catch {
    try { return JSON.parse(raw.replace(/,(\s*[}\]])/g, '$1')); } catch { return null; }
  }
}

function parseCharacterResponse(text) {
  let t = text;

  // CHARACTER_MEMORY
  const memMatch = t.match(/\[CHARACTER_MEMORY\]([\s\S]*?)\[\/CHARACTER_MEMORY\]/);
  if (memMatch) t = t.replace(memMatch[0], '').trim();

  // HINT
  const hintMatch = t.match(/\[HINT:\s*(.+?)\]/);
  const hint = hintMatch ? hintMatch[1].trim() : null;
  if (hintMatch) t = t.replace(hintMatch[0], '').trim();

  // ENGLISH
  const engMatch = t.match(/\[ENGLISH:\s*([\s\S]*?)\]/);
  const english = engMatch ? engMatch[1].trim() : null;
  if (engMatch) t = t.replace(engMatch[0], '').trim();

  // DEBRIEF
  const debMatch = t.match(/\[DEBRIEF\]([\s\S]*?)\[\/DEBRIEF\]/);
  const debrief = debMatch ? tryParseJSON(debMatch[1].trim()) : null;
  if (debMatch) t = t.replace(debMatch[0], '').trim();

  return { spoken: t.trim(), debrief, hint, english };
}

// ---------------------------------------------------------------------------
// Anthropic API caller with retry + rate limiting
// ---------------------------------------------------------------------------
let lastCallTime = 0;

async function callClaude(systemPrompt, messages, { model = 'claude-sonnet-4-6', maxTokens = 500 } = {}) {
  // Rate limit: 1s between calls
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

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${res.status}: ${body}`);
      }

      const data = await res.json();
      return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    } catch (err) {
      if (attempt < 2) {
        console.log(`  Retry ${attempt + 1}: ${err.message}`);
        await sleep(2000);
      } else throw err;
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Live end-of-conversation detection
// ---------------------------------------------------------------------------
// Live scenarios don't emit [DEBRIEF] tags — they end either at maxTurns
// or when the character delivers a clear farewell. Mirrors the same regex
// LiveConversationScreen.jsx uses for endOnCharacterFarewell so QA
// simulation matches runtime behavior.
const FAREWELL_RE = /\b(arrivederci|alla\s+prossima|a\s+presto|a\s+domani|buon\s+riposo|buon\s+proseguimento|buon\s+pomeriggio|buon\s+appetito|buon\s+viaggio|buona\s+giornata|buona\s+serata|buona\s+partita|buona\s+cena|buona\s+spesa|forza\s+milan|ci\s+vediamo)\b/i;
const TRAILING_CIAO_RE = /\bciao(\s+ciao)?[\s!.?]*$/i;

function isFarewellLine(text) {
  if (!text) return false;
  if (FAREWELL_RE.test(text)) return true;
  if (TRAILING_CIAO_RE.test(text.trim())) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Dynamic location loader
// ---------------------------------------------------------------------------
async function loadLocation(loc) {
  // Cache-bust on each load so re-test after an applied edit picks up
  // the new module content. Without the query param Node memoizes the
  // first import for the lifetime of the process.
  const cacheBust = `?t=${Date.now()}`;
  const mod = await import(`file://${resolve(DATA_DIR, loc.file).replace(/\\/g, '/')}${cacheBust}`);
  return {
    ...loc,
    scenario: mod.scenario,                       // live.maxTurns / live.endOnCharacterFarewell live here
    keyPhrases: mod.keyPhrases,
    coreVocab: mod.coreVocab,
    extendedVocab: mod.extendedVocab || [],
    whisperHints: mod.whisperHints || [],
    buildSystemPrompt: mod.buildSystemPrompt,
  };
}

// ---------------------------------------------------------------------------
// Chad system prompt builders
// ---------------------------------------------------------------------------
function buildObedientChadPrompt(keyPhrases) {
  const phraseList = keyPhrases.map(p => `- "${p.it}" (${p.en})`).join('\n');
  return `You are Chad, an American tourist in Milan. You are friendly, eager, and trying your best — but you are COMPLETELY monolingual. You speak ZERO Italian beyond the exact phrases listed below.

YOUR COMPLETE ITALIAN VOCABULARY (these are the ONLY phrases you know):
${phraseList}

RULES:
- You may ONLY use phrases from the list above. You may combine them or use fragments of them, but you cannot invent new Italian.
- If the character asks you something and you have no phrase that fits, say "Non ho capito" or try to use the closest phrase you have, even if it's awkward.
- You are having a real conversation. Respond naturally to what the character says — greet them back, answer their questions, follow the flow.
- When the character asks "Dove andate adesso?" or "Dove va adesso?" (or similar transition question), pick a destination. Say "il Duomo" or "la metro" or similar.
- Be warm and enthusiastic. You're excited to be in Milan.
- Keep responses SHORT — 1-2 phrases max per turn. You're a beginner, not giving speeches.
- When you truly have nothing to say, just pick the most relevant phrase from your list and use it.
- Ignore any ~tilde stage directions~ in the character's message — those are scene-setting, not dialogue.

The conversation is starting now. The character will speak first. Respond as Chad.`;
}

function buildImprovisingChadPrompt(keyPhrases) {
  const phraseList = keyPhrases.map(p => `- "${p.it}" (${p.en})`).join('\n');
  return `You are Chad, an American tourist in Milan. You are friendly, eager, and trying your best — but you are a BEGINNER. You know some basic phrases and are willing to improvise.

YOUR BASE ITALIAN VOCABULARY:
${phraseList}

RULES:
- Start with the phrases above as your base, but you may ADAPT them slightly:
  - Swap a word (e.g., "moglie" to "ragazza", "due" to "tre")
  - Add a small detail in broken Italian ("Ho una prenotazione per Chad e mia moglie")
  - Try a Spanish cognate when stuck (e.g., "reservacion" instead of "prenotazione")
  - Combine phrases creatively
- You should NOT suddenly speak fluent Italian. You're still a beginner improvising.
- If the character asks something unexpected, try your best with what you have.
- When the character asks "Dove andate adesso?" or "Dove va adesso?", pick a destination and try to say it naturally.
- Keep responses SHORT — 1-3 phrases max per turn.
- Ignore any ~tilde stage directions~ in the character's message — those are scene-setting, not dialogue.

The conversation is starting now. The character will speak first. Respond as Chad.`;
}

// ---------------------------------------------------------------------------
// Run a single conversation simulation
// ---------------------------------------------------------------------------
async function runConversation(location, chadType) {
  const systemPrompt = location.buildSystemPrompt('normale');
  const chadPrompt = chadType === 'obedient'
    ? buildObedientChadPrompt(location.keyPhrases)
    : buildImprovisingChadPrompt(location.keyPhrases);

  const charMessages = []; // Messages sent to the character (Claude)
  const chadMessages = []; // Messages sent to Chad (Claude)
  const transcript = [];
  let debrief = null;
  let turnCount = 0;
  // Live scenarios cap at scenario.live.maxTurns. Add a small headroom
  // so the runner doesn't stop one turn before the farewell would land.
  // Falls back to 20 for the legacy [DEBRIEF]-driven path.
  const MAX_TURNS = (location.scenario?.live?.maxTurns || 20) + 2;
  // Live scenarios may opt in to early-exit on a clear character farewell
  // (mirrors LiveConversationScreen.jsx). Default behavior: ON for any Live
  // scenario, since QA wants the same end-detection the runtime uses.
  const farewellEnabled = !!location.scenario?.live;
  const farewellMinTurn = location.scenario?.live?.farewellMinTurn ?? 4;

  // Track repeated beats for stall detection
  const recentCharLines = [];

  // Step 1: Character speaks first (stage direction as user message)
  charMessages.push({ role: 'user', content: location.stageDirection });
  const firstResponse = await callClaude(systemPrompt, charMessages);
  charMessages.push({ role: 'assistant', content: firstResponse });

  const first = parseCharacterResponse(firstResponse);
  transcript.push({ turn: 0, speaker: location.charName, raw: firstResponse, spoken: first.spoken, hint: first.hint });

  if (verbose) console.log(`  [${location.charName}]: ${first.spoken}`);

  if (first.debrief) {
    debrief = first.debrief;
    return { completed: true, turnCount: 0, transcript, debrief, stalled: false };
  }

  recentCharLines.push(first.spoken.slice(0, 80));

  // Step 2: Conversation loop
  let endedByFarewell = false;
  while (turnCount < MAX_TURNS && !debrief && !endedByFarewell) {
    turnCount++;

    // Chad responds to what the character said
    // Send the character's spoken text (stripped of metadata) to Chad
    const spokenForChad = first.spoken && turnCount === 1 ? first.spoken : transcript[transcript.length - 1].spoken;
    chadMessages.push({ role: turnCount === 1 ? 'user' : 'user', content: spokenForChad });
    const chadResponse = await callClaude(chadPrompt, chadMessages);
    chadMessages.push({ role: 'assistant', content: chadResponse });

    transcript.push({ turn: turnCount, speaker: 'Chad', raw: chadResponse, spoken: chadResponse });
    if (verbose) console.log(`  [Chad]: ${chadResponse}`);

    // Character responds to Chad
    charMessages.push({ role: 'user', content: chadResponse });
    const charResponse = await callClaude(systemPrompt, charMessages);
    charMessages.push({ role: 'assistant', content: charResponse });

    const parsed = parseCharacterResponse(charResponse);
    transcript.push({ turn: turnCount, speaker: location.charName, raw: charResponse, spoken: parsed.spoken, hint: parsed.hint });
    if (verbose) console.log(`  [${location.charName}]: ${parsed.spoken}`);

    if (parsed.debrief) {
      debrief = parsed.debrief;
      break;
    }

    // Live end-detection: a clear farewell from the character ends the
    // conversation gracefully. Skipped on early turns so an opening
    // "Ciao!" or "Buongiorno!" doesn't false-trigger.
    if (farewellEnabled && turnCount >= farewellMinTurn && isFarewellLine(parsed.spoken)) {
      endedByFarewell = true;
      break;
    }

    // Stall detection: same beat 3+ times
    recentCharLines.push(parsed.spoken.slice(0, 80));
    if (recentCharLines.length >= 3) {
      const last3 = recentCharLines.slice(-3);
      if (last3[0] === last3[1] && last3[1] === last3[2]) {
        if (verbose) console.log('  STALL DETECTED: character repeating same line 3x');
        break;
      }
    }
  }

  return {
    // For Claude-era scenarios "completed" meant a [DEBRIEF] block fired.
    // For Live scenarios the natural end is a character farewell — count
    // either as completion. Stalling is hitting MAX_TURNS without either.
    completed: !!debrief || endedByFarewell,
    turnCount,
    transcript,
    debrief,
    stalled: !debrief && !endedByFarewell && turnCount >= MAX_TURNS,
    endedByFarewell
  };
}

// ---------------------------------------------------------------------------
// Analyze a run's results
// ---------------------------------------------------------------------------
function analyzeRun(location, result, chadType) {
  const phraseTexts = location.keyPhrases.map(p => p.it.toLowerCase());

  // Find which phrases Chad used
  const chadLines = result.transcript.filter(t => t.speaker === 'Chad').map(t => t.spoken.toLowerCase());
  const allChadText = chadLines.join(' ');

  const phrasesUsed = [];
  const phrasesUnused = [];
  for (const p of location.keyPhrases) {
    // Check fragments — a phrase like "Buongiorno / Buonasera" counts if either part appears
    const variants = p.it.toLowerCase().split(/\s*\/\s*/);
    const used = variants.some(v => allChadText.includes(v.trim()));
    if (used) phrasesUsed.push(p.it);
    else phrasesUnused.push(p.it);
  }

  // Find sufficiency gaps (turns where Chad seemed stuck)
  const sufficiencyGaps = [];
  for (let i = 0; i < result.transcript.length - 1; i++) {
    const entry = result.transcript[i];
    const next = result.transcript[i + 1];
    if (entry.speaker !== 'Chad' || !next) continue;
    // Detect if Chad said "Non ho capito" or recycled an earlier phrase awkwardly
    const chadText = entry.spoken.toLowerCase();
    if (chadText.includes('non ho capito') || chadText.includes('non capisco')) {
      const prevChar = result.transcript.slice(0, i).reverse().find(t => t.speaker !== 'Chad');
      sufficiencyGaps.push({
        turn: entry.turn,
        characterSaid: prevChar ? prevChar.spoken : '(start)',
        chadNeeded: 'A phrase to respond to the character — Chad had to punt with "Non ho capito"',
        chadDid: entry.spoken
      });
    }
  }

  // Detect character violations (English in dialogue, etc.)
  const characterViolations = [];
  const charLines = result.transcript.filter(t => t.speaker !== 'Chad');
  for (const line of charLines) {
    const spoken = line.spoken;
    // Check for English words (basic heuristic — common English words that wouldn't appear in Italian)
    const englishWords = spoken.match(/\b(what|would|like|please|welcome|hello|how|the|your|here|good|thank|sorry|can|do|have|want|need|this|that|look|come|take|let|just|right|okay)\b/gi);
    if (englishWords && englishWords.length >= 2) {
      characterViolations.push({
        turn: line.turn,
        violation: `Character may have used English in dialogue: "${spoken.slice(0, 100)}"`,
        severity: englishWords.length >= 4 ? 'high' : 'medium'
      });
    }
  }

  return {
    completed: result.completed,
    turnCount: result.turnCount,
    stalled: result.stalled,
    phrasesUsed,
    phrasesUnused,
    phraseUtilization: `${phrasesUsed.length}/${location.keyPhrases.length}`,
    sufficiencyGaps,
    characterViolations,
    transcript: result.transcript,
    debrief: result.debrief
  };
}

// ---------------------------------------------------------------------------
// Produce findings for a location
// ---------------------------------------------------------------------------
function produceFindings(location, obedientResult, improvisingResult) {
  const obedientAnalysis = analyzeRun(location, obedientResult, 'obedient');
  const improvisingAnalysis = analyzeRun(location, improvisingResult, 'improvising');

  // Detect derailment moments in improvising run
  const derailmentMoments = [];
  const impChadLines = improvisingResult.transcript.filter(t => t.speaker === 'Chad');
  for (const line of impChadLines) {
    const text = line.spoken.toLowerCase();
    // Check if Chad improvised beyond key phrases
    const phraseTexts = location.keyPhrases.flatMap(p => p.it.toLowerCase().split(/\s*\/\s*/));
    const isStrict = phraseTexts.some(p => text.includes(p.trim()));
    if (!isStrict && text.length > 10) {
      const nextChar = improvisingResult.transcript.find(t => t.turn === line.turn && t.speaker !== 'Chad');
      derailmentMoments.push({
        turn: line.turn,
        chadSaid: line.spoken,
        characterResponse: nextChar ? nextChar.spoken.slice(0, 100) : '(no response)',
        handled: !nextChar?.spoken.toLowerCase().includes('non ho capito')
      });
    }
  }

  const fixesNeeded = [];

  // Check sufficiency gaps
  if (obedientAnalysis.sufficiencyGaps.length > 0) {
    for (const gap of obedientAnalysis.sufficiencyGaps) {
      fixesNeeded.push(`Sufficiency gap at turn ${gap.turn}: ${gap.chadNeeded}`);
    }
  }

  // Check unused phrases
  if (obedientAnalysis.phrasesUnused.length > location.keyPhrases.length * 0.5) {
    fixesNeeded.push(`Low phrase utilization (${obedientAnalysis.phraseUtilization}) — consider adjusting arc to use more phrases, or remove truly irrelevant ones`);
  }

  // Check character violations
  for (const v of obedientAnalysis.characterViolations) {
    if (v.severity === 'high') {
      fixesNeeded.push(`Character used English at turn ${v.turn}: ${v.violation}`);
    }
  }

  // Check completion
  if (!obedientAnalysis.completed) {
    fixesNeeded.push('Obedient Chad could not complete the conversation — arc may be too complex for available phrases');
  }
  if (!improvisingAnalysis.completed) {
    fixesNeeded.push('Improvising Chad could not complete the conversation');
  }

  // Grade
  let grade = 'A';
  if (fixesNeeded.length > 0) grade = 'B+';
  if (fixesNeeded.length > 2) grade = 'B';
  if (!obedientAnalysis.completed) grade = 'C';
  if (!obedientAnalysis.completed && !improvisingAnalysis.completed) grade = 'D';

  return {
    location: location.id,
    characterName: location.charName,
    obedientRun: obedientAnalysis,
    improvisingRun: {
      ...improvisingAnalysis,
      derailmentMoments
    },
    summary: {
      completable: obedientAnalysis.completed,
      phraseUtilization: obedientAnalysis.phraseUtilization,
      missingPhrases: obedientAnalysis.sufficiencyGaps.map(g => g.chadNeeded),
      unusedPhrases: obedientAnalysis.phrasesUnused,
      derailmentHandling: derailmentMoments.every(d => d.handled) ? 'good' : 'needs work',
      overallGrade: grade,
      fixesNeeded
    }
  };
}

// ---------------------------------------------------------------------------
// Programmer Agent — uses Claude to generate targeted fixes
// ---------------------------------------------------------------------------
// Two entry points share one Claude call:
//   - proposeFixes  — writes scripts/qa-findings/<id>.proposal.md, leaves
//                     src/data/* untouched. Default. Conversational
//                     workflow: Claude (in chat) reads the proposal and
//                     discusses with the user before any source change.
//   - applyFixes    — writes the edits straight to src/data/<file>. Opt-in.
//                     Preserves the original auto-edit behavior.
// Both call requestEditsFromClaude under the hood.
async function requestEditsFromClaude(location, findings) {
  const filePath = resolve(DATA_DIR, location.file);
  const fileContent = readFileSync(filePath, 'utf-8');

  const programmerPrompt = `You are an expert programmer working on the Milano Mio Italian learning app. You've received QA findings for the "${location.id}" location (character: ${location.charName}).

Your job is to make TARGETED fixes to the location's JavaScript file. You must output a JSON array of edits, each with "old" (exact string to find) and "new" (replacement string).

RULES:
- NEVER rewrite the entire system prompt. Make surgical edits.
- NEVER change the character's personality or voice.
- NEVER remove vocabulary from coreVocab or extendedVocab — only add.
- ALWAYS preserve the existing conversation arc structure — only adjust individual steps.
- When adding keyPhrases, match the existing format exactly (including phonetic spelling).
- When editing system prompt text, keep the same style and tone as surrounding text.
- Only fix issues identified in the findings. Do NOT make speculative improvements.

FIX CATEGORIES:
1. Add missing keyPhrases (if sufficiency gaps found)
2. Adjust conversation arc steps (if phrases are unused because the arc never creates a moment for them)
3. Fix character prompt violations (if character leaked English or broke rules)
4. Improve derailment handling (if improvising Chad caused issues)

OUTPUT FORMAT — respond with ONLY a JSON object like this:
{
  "edits": [
    { "old": "exact string from the file", "new": "replacement string" }
  ],
  "explanation": "Brief summary of what was fixed and why"
}

If no fixes are needed, respond with: { "edits": [], "explanation": "No fixes needed" }`;

  const findingsStr = JSON.stringify(findings.summary, null, 2);
  const gapsStr = JSON.stringify(findings.obedientRun.sufficiencyGaps, null, 2);
  const violationsStr = JSON.stringify(findings.obedientRun.characterViolations, null, 2);

  const userMessage = `Here are the QA findings:

SUMMARY:
${findingsStr}

SUFFICIENCY GAPS (turns where Obedient Chad was stuck):
${gapsStr}

CHARACTER VIOLATIONS:
${violationsStr}

UNUSED PHRASES: ${findings.obedientRun.phrasesUnused.join(', ')}

OBEDIENT CHAD COMPLETED: ${findings.obedientRun.completed} (${findings.obedientRun.turnCount} turns)
IMPROVISING CHAD COMPLETED: ${findings.improvisingRun.completed} (${findings.improvisingRun.turnCount} turns)

Here is the CURRENT file content:

\`\`\`javascript
${fileContent}
\`\`\`

Produce targeted edits to fix the issues. Remember: output ONLY valid JSON.`;

  const response = await callClaude(programmerPrompt, [{ role: 'user', content: userMessage }], { maxTokens: 2000 });

  // Parse the JSON response
  let edits;
  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    edits = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.log(`  WARNING: Could not parse programmer response: ${err.message}`);
    if (verbose) console.log(`  Response: ${response.slice(0, 500)}`);
    return { applied: false, explanation: 'Failed to parse programmer response' };
  }

  return {
    edits: edits.edits || [],
    explanation: edits.explanation || (edits.edits?.length ? '' : 'No edits proposed'),
    fileContent,
    filePath
  };
}

// proposeFixes — markdown report only, no source-file writes. This is the
// conversational interface: Claude (in chat) reads the proposal, summarizes
// findings, and discusses with the user before anything touches src/data.
async function proposeFixes(location, findings) {
  const result = await requestEditsFromClaude(location, findings);

  // Build a markdown proposal. Each edit gets its own section with a
  // short rationale and the exact before/after snippet so the chat
  // workflow can quote them back without re-reading the source.
  const date = new Date().toISOString();
  const lines = [];
  lines.push(`# QA Proposal — ${location.id} (${location.charName})`);
  lines.push('');
  lines.push(`Generated: ${date}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Grade: ${findings.summary.overallGrade}`);
  lines.push(`- Phrase utilization: ${findings.summary.phraseUtilization}`);
  lines.push(`- Obedient Chad: ${findings.obedientRun.completed ? 'completed' : 'incomplete'} in ${findings.obedientRun.turnCount} turns`);
  lines.push(`- Improvising Chad: ${findings.improvisingRun.completed ? 'completed' : 'incomplete'} in ${findings.improvisingRun.turnCount} turns`);
  lines.push('');

  if (findings.obedientRun.phrasesUnused?.length) {
    lines.push('## Sidebar phrases not used by Obedient Chad');
    for (const p of findings.obedientRun.phrasesUnused) lines.push(`- ${p}`);
    lines.push('');
  }

  if (findings.summary.fixesNeeded?.length) {
    lines.push('## Issues flagged');
    for (const f of findings.summary.fixesNeeded) lines.push(`- ${f}`);
    lines.push('');
  }

  lines.push(`## Programmer Agent rationale`);
  lines.push('');
  lines.push(result.explanation || '_(no rationale returned)_');
  lines.push('');

  if (!result.edits.length) {
    lines.push('## Proposed edits');
    lines.push('');
    lines.push('_None — Programmer Agent did not propose any source-file changes._');
  } else {
    lines.push(`## Proposed edits (${result.edits.length})`);
    lines.push('');
    lines.push(`Apply with: \`node scripts/qa-pipeline.mjs apply ${location.id}\` — or, in chat, ask Claude to apply specific edits via the Edit tool after review.`);
    lines.push('');
    result.edits.forEach((edit, i) => {
      const matches = result.fileContent.includes(edit.old);
      lines.push(`### Edit ${i + 1}${matches ? '' : ' — ⚠️ target string not found'}`);
      lines.push('');
      lines.push('**Find:**');
      lines.push('```');
      lines.push(edit.old);
      lines.push('```');
      lines.push('');
      lines.push('**Replace with:**');
      lines.push('```');
      lines.push(edit.new);
      lines.push('```');
      lines.push('');
    });
  }

  const proposalPath = resolve(FINDINGS_DIR, `${location.id}.proposal.md`);
  writeFileSync(proposalPath, lines.join('\n'), 'utf-8');
  console.log(`  Wrote proposal: ${proposalPath}`);
  console.log(`  ${result.edits.length} edit(s) proposed — no source files modified.`);

  return { proposed: result.edits.length, explanation: result.explanation, proposalPath };
}

// applyFixes — opt-in: writes the edits straight to src/data/<file>.
// Preserves the original auto-edit behavior for users who want it.
async function applyFixes(location, findings) {
  const result = await requestEditsFromClaude(location, findings);

  if (!result.edits.length) {
    return { applied: false, explanation: result.explanation, editCount: 0 };
  }

  let content = result.fileContent;
  let appliedCount = 0;
  for (const edit of result.edits) {
    if (content.includes(edit.old)) {
      content = content.replace(edit.old, edit.new);
      appliedCount++;
    } else {
      console.log(`  WARNING: Could not find edit target: "${edit.old.slice(0, 80)}..."`);
    }
  }

  if (appliedCount > 0) {
    writeFileSync(result.filePath, content, 'utf-8');
    console.log(`  Applied ${appliedCount}/${result.edits.length} edits to ${result.filePath}`);
  }

  return { applied: appliedCount > 0, explanation: result.explanation, editCount: appliedCount };
}

// ---------------------------------------------------------------------------
// Staged subcommands
// ---------------------------------------------------------------------------
// Each stage caches its output in scripts/qa-findings/ so later stages
// can re-use prior work without re-paying for Claude calls.
//   simulate  →  <id>.transcripts.json
//   analyze   →  <id>.json (existing findings shape)
//   propose   →  <id>.proposal.md
//   apply     →  src/data/<file>  (writes!)

function findLocation(id) {
  const loc = LOCATIONS.find(l => l.id === id);
  if (!loc) {
    console.error(`Unknown scenario: ${id}`);
    console.error(`Available: ${LOCATIONS.map(l => l.id).join(', ')}`);
    process.exit(1);
  }
  return loc;
}

function transcriptsPath(id) { return resolve(FINDINGS_DIR, `${id}.transcripts.json`); }
function findingsPath(id) { return resolve(FINDINGS_DIR, `${id}.json`); }

async function cmdSimulate(id) {
  const loc = findLocation(id);
  const location = await loadLocation(loc);
  console.log(`\nSimulating ${id} (${loc.charName})...`);

  console.log('  --- Run A: Obedient Chad ---');
  const obedient = await runConversation(location, 'obedient');
  console.log(`  ${obedient.completed ? 'COMPLETED' : 'INCOMPLETE'} in ${obedient.turnCount} turns${obedient.endedByFarewell ? ' (farewell)' : ''}`);

  console.log('  --- Run B: Improvising Chad ---');
  const improvising = await runConversation(location, 'improvising');
  console.log(`  ${improvising.completed ? 'COMPLETED' : 'INCOMPLETE'} in ${improvising.turnCount} turns${improvising.endedByFarewell ? ' (farewell)' : ''}`);

  writeFileSync(transcriptsPath(id), JSON.stringify({ obedient, improvising }, null, 2));
  console.log(`  Cached: ${transcriptsPath(id)}`);
  return { obedient, improvising };
}

async function cmdAnalyze(id, { from } = {}) {
  const loc = findLocation(id);
  const location = await loadLocation(loc);

  let obedient, improvising;

  if (from?.startsWith('real:')) {
    // Real-session ingestion: pull all sessions matching this scenario
    // from a sessions JSON exported via the dev-mode export button.
    const path = from.slice('real:'.length);
    console.log(`\nAnalyzing ${id} from real sessions: ${path}`);
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    const sessions = (data.sessions || []).filter(s =>
      s.scenarioId === id || s.scenarioId === loc.file.replace('.js', '') || s.scenarioId === loc.id
    );
    if (!sessions.length) {
      console.error(`No real sessions found for ${id} in ${path}`);
      process.exit(1);
    }
    console.log(`  Found ${sessions.length} real session(s) — using most recent.`);
    // Use the most recent session as the obedient run; reuse for improvising
    // since real sessions don't differentiate.
    const recent = sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    const transcript = (recent.transcript || []).map((line, i) => ({
      turn: Math.floor(i / 2),
      speaker: line.role === 'user' ? 'Chad' : loc.charName,
      raw: line.text,
      spoken: line.text
    }));
    obedient = { completed: true, turnCount: Math.floor(transcript.length / 2), transcript, debrief: recent.debrief, stalled: false, endedByFarewell: false };
    improvising = obedient;
  } else {
    // Synthetic: load cached transcripts or run a fresh simulation.
    if (!existsSync(transcriptsPath(id))) {
      console.log(`  No cached transcripts — simulating first.`);
      ({ obedient, improvising } = await cmdSimulate(id));
    } else {
      console.log(`\nAnalyzing ${id} from cached transcripts.`);
      const cached = JSON.parse(readFileSync(transcriptsPath(id), 'utf-8'));
      obedient = cached.obedient;
      improvising = cached.improvising;
    }
  }

  const findings = produceFindings(location, obedient, improvising);
  writeFileSync(findingsPath(id), JSON.stringify(findings, null, 2));
  console.log(`  Grade: ${findings.summary.overallGrade} | Phrase utilization: ${findings.summary.phraseUtilization}`);
  console.log(`  Issues: ${findings.summary.fixesNeeded.length}`);
  console.log(`  Cached: ${findingsPath(id)}`);
  return findings;
}

async function cmdPropose(id, { from } = {}) {
  const loc = findLocation(id);
  const location = await loadLocation(loc);
  let findings;
  if (existsSync(findingsPath(id)) && !from) {
    console.log(`\nProposing edits for ${id} from cached findings.`);
    findings = JSON.parse(readFileSync(findingsPath(id), 'utf-8'));
  } else {
    findings = await cmdAnalyze(id, { from });
  }
  console.log('  --- Programmer Agent (propose) ---');
  return await proposeFixes(location, findings);
}

async function cmdApply(id, { from } = {}) {
  const loc = findLocation(id);
  const location = await loadLocation(loc);
  let findings;
  if (existsSync(findingsPath(id)) && !from) {
    findings = JSON.parse(readFileSync(findingsPath(id), 'utf-8'));
  } else {
    findings = await cmdAnalyze(id, { from });
  }
  console.log('  --- Programmer Agent (apply) ---');
  return await applyFixes(location, findings);
}

function printUsage() {
  console.log(`
Milano Mio QA Pipeline

Usage:
  node scripts/qa-pipeline.mjs <command> <scenarioId> [flags]

Commands:
  simulate <id>                 Run obedient + improvising sims, cache transcripts
  analyze  <id> [--from=real:<path>]
                                Analyze cached transcripts (or a real-session export);
                                writes <id>.json findings
  propose  <id>                 Default chat workflow. Generates a markdown proposal at
                                scripts/qa-findings/<id>.proposal.md — NO source writes.
  apply    <id>                 OPT-IN auto-edit. Writes the Programmer Agent's edits
                                straight into src/data/<file>.
  run      <id>                 Alias for propose.
  all                           Legacy bulk mode — runs every scenario through the old
                                analyze + apply + retest flow. Honors --skip-fixes.

Flags:
  --from=real:<path>            Use real Gemini Live transcripts (exported via the
                                dev-mode QA Export button) instead of fresh sims
  --location=<id>               (legacy) restrict bulk mode to one scenario
  --skip-fixes                  (legacy) skip the apply phase in bulk mode
  --verbose                     log every turn

Available scenarios: ${LOCATIONS.map(l => l.id).join(', ')}
`);
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------
async function main() {
  // Subcommand dispatch (preferred). Anything unrecognized falls through
  // to the legacy bulk flow below for back-compat.
  if (subcommand && ['simulate', 'analyze', 'propose', 'apply', 'run'].includes(subcommand)) {
    if (!subcommandId) {
      console.error(`'${subcommand}' requires a scenario id.`);
      printUsage();
      process.exit(1);
    }
    if (subcommand === 'simulate') { await cmdSimulate(subcommandId); return; }
    if (subcommand === 'analyze')  { await cmdAnalyze(subcommandId, { from: flagFrom }); return; }
    if (subcommand === 'propose' || subcommand === 'run') { await cmdPropose(subcommandId, { from: flagFrom }); return; }
    if (subcommand === 'apply')    { await cmdApply(subcommandId, { from: flagFrom }); return; }
  }
  if (subcommand === 'help' || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  // Legacy bulk-flow path. `node qa-pipeline.mjs all` or no subcommand at
  // all (with optional --location / --skip-fixes) runs every scenario
  // through the old analyze + auto-apply + retest pipeline.
  const locationsToTest = flagLocation
    ? LOCATIONS.filter(l => l.id === flagLocation)
    : LOCATIONS;

  if (locationsToTest.length === 0) {
    console.error(`Unknown location: ${flagLocation}`);
    console.error(`Available: ${LOCATIONS.map(l => l.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`\nMilano Mio QA Pipeline`);
  console.log(`Testing ${locationsToTest.length} location(s)${skipFixes ? ' (test only)' : ''}\n`);

  const results = [];

  for (const loc of locationsToTest) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${loc.id} — ${loc.charName}`);
    console.log('='.repeat(60));

    // Load the location module (fresh import each time for re-tests)
    let location;
    try {
      location = await loadLocation(loc);
    } catch (err) {
      console.error(`  ERROR loading ${loc.id}: ${err.message}`);
      results.push({ location: loc.id, charName: loc.charName, status: 'error', error: err.message });
      continue;
    }

    // Run A: Obedient Chad
    console.log(`\n  --- Run A: Obedient Chad ---`);
    let obedientResult;
    try {
      obedientResult = await runConversation(location, 'obedient');
      console.log(`  Result: ${obedientResult.completed ? 'COMPLETED' : 'INCOMPLETE'} in ${obedientResult.turnCount} turns`);
    } catch (err) {
      console.error(`  ERROR in obedient run: ${err.message}`);
      results.push({ location: loc.id, charName: loc.charName, status: 'error', error: err.message });
      continue;
    }

    // Run B: Improvising Chad
    console.log(`\n  --- Run B: Improvising Chad ---`);
    let improvisingResult;
    try {
      improvisingResult = await runConversation(location, 'improvising');
      console.log(`  Result: ${improvisingResult.completed ? 'COMPLETED' : 'INCOMPLETE'} in ${improvisingResult.turnCount} turns`);
    } catch (err) {
      console.error(`  ERROR in improvising run: ${err.message}`);
      results.push({ location: loc.id, charName: loc.charName, status: 'error', error: err.message });
      continue;
    }

    // Produce findings
    const findings = produceFindings(location, obedientResult, improvisingResult);
    writeFileSync(
      resolve(FINDINGS_DIR, `${loc.id}.json`),
      JSON.stringify(findings, null, 2),
      'utf-8'
    );
    console.log(`\n  Grade: ${findings.summary.overallGrade}`);
    console.log(`  Phrase utilization: ${findings.summary.phraseUtilization}`);
    console.log(`  Fixes needed: ${findings.summary.fixesNeeded.length}`);

    if (findings.summary.fixesNeeded.length > 0) {
      for (const fix of findings.summary.fixesNeeded) {
        console.log(`    - ${fix}`);
      }
    }

    // Fix phase
    if (findings.summary.fixesNeeded.length > 0 && !skipFixes) {
      console.log(`\n  --- Programmer Agent ---`);
      // Legacy main() flow uses the old auto-write path. The new
      // subcommand dispatcher (next commit) defaults to proposeFixes.
      const fixResult = await applyFixes(location, findings);
      console.log(`  ${fixResult.explanation}`);

      if (fixResult.applied) {
        // Re-test
        console.log(`\n  --- Re-test: Obedient Chad ---`);
        // Clear module cache by adding a query param
        const cacheBust = `?t=${Date.now()}`;
        const reloadedMod = await import(`file://${resolve(DATA_DIR, loc.file).replace(/\\/g, '/')}${cacheBust}`);
        const reloadedLocation = {
          ...loc,
          keyPhrases: reloadedMod.keyPhrases,
          coreVocab: reloadedMod.coreVocab,
          extendedVocab: reloadedMod.extendedVocab || [],
          buildSystemPrompt: reloadedMod.buildSystemPrompt,
        };

        const retestResult = await runConversation(reloadedLocation, 'obedient');
        console.log(`  Re-test: ${retestResult.completed ? 'COMPLETED' : 'INCOMPLETE'} in ${retestResult.turnCount} turns`);

        const retestFindings = produceFindings(reloadedLocation, retestResult, improvisingResult);
        console.log(`  Re-test grade: ${retestFindings.summary.overallGrade}`);

        results.push({
          location: loc.id,
          charName: loc.charName,
          status: retestFindings.summary.fixesNeeded.length === 0 || retestResult.completed ? 'passed_after_fix' : 'needs_review',
          firstRun: findings.summary,
          fixApplied: fixResult.explanation,
          retest: retestFindings.summary
        });
      } else {
        results.push({
          location: loc.id,
          charName: loc.charName,
          status: findings.summary.fixesNeeded.length === 0 ? 'passed' : 'needs_review',
          firstRun: findings.summary,
          fixApplied: null
        });
      }
    } else {
      results.push({
        location: loc.id,
        charName: loc.charName,
        status: findings.summary.fixesNeeded.length === 0 ? 'passed' : (skipFixes ? 'needs_fix' : 'passed'),
        firstRun: findings.summary
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Write summary report
  // ---------------------------------------------------------------------------
  const passed = results.filter(r => r.status === 'passed').length;
  const passedAfterFix = results.filter(r => r.status === 'passed_after_fix').length;
  const needsReview = results.filter(r => r.status === 'needs_review' || r.status === 'needs_fix').length;
  const errors = results.filter(r => r.status === 'error').length;

  const date = new Date().toISOString().split('T')[0];
  let md = `# Milano Mio QA Results — ${date}\n\n`;
  md += `## Summary\n`;
  md += `- Locations tested: ${results.length}\n`;
  md += `- Passed on first run: ${passed}\n`;
  md += `- Passed after fixes: ${passedAfterFix}\n`;
  md += `- Flagged for manual review: ${needsReview}\n`;
  md += `- Errors: ${errors}\n\n`;
  md += `## Per-Location Results\n\n`;

  for (const r of results) {
    const icon = r.status === 'passed' ? '\u2705' : r.status === 'passed_after_fix' ? '\u2705' : r.status === 'error' ? '\u274C' : '\u26A0\uFE0F';
    md += `### ${icon} ${r.location} — ${r.charName}\n`;

    if (r.error) {
      md += `- Error: ${r.error}\n\n`;
      continue;
    }

    md += `- Obedient Chad: ${r.firstRun.completable ? 'Completed' : 'Incomplete'}\n`;
    md += `- Phrase utilization: ${r.firstRun.phraseUtilization}\n`;
    md += `- Grade: ${r.firstRun.overallGrade}\n`;

    if (r.firstRun.fixesNeeded.length > 0) {
      md += `- Issues found:\n`;
      for (const fix of r.firstRun.fixesNeeded) {
        md += `  - ${fix}\n`;
      }
    }

    if (r.fixApplied) {
      md += `- Fix applied: ${r.fixApplied}\n`;
      if (r.retest) {
        md += `- Re-test grade: ${r.retest.overallGrade}\n`;
      }
    }

    if (r.firstRun.unusedPhrases && r.firstRun.unusedPhrases.length > 0) {
      md += `- Unused phrases: ${r.firstRun.unusedPhrases.join(', ')}\n`;
    }

    md += `\n`;
  }

  writeFileSync(resolve(ROOT, 'QA_RESULTS.md'), md, 'utf-8');
  console.log(`\n${'='.repeat(60)}`);
  console.log(`QA COMPLETE`);
  console.log(`Passed: ${passed + passedAfterFix} | Needs review: ${needsReview} | Errors: ${errors}`);
  console.log(`Results written to QA_RESULTS.md`);
  console.log(`Findings in scripts/qa-findings/`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
