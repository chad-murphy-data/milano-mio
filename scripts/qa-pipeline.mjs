#!/usr/bin/env node

// Milano Mio — Automated Location QA Pipeline
// Usage: ANTHROPIC_API_KEY=sk-ant-... node scripts/qa-pipeline.mjs [--location=caffe] [--skip-fixes] [--verbose]

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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
const args = process.argv.slice(2);
const flagLocation = args.find(a => a.startsWith('--location='))?.split('=')[1];
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
const LOCATIONS = [
  { id: 'hotel', file: 'hotel.js', charName: 'Giulia', stageDirection: '[Chad arrives at the hotel reception desk with luggage.]' },
  { id: 'caffe', file: 'caffe.js', charName: 'Marco', stageDirection: '[Chad walks up to the bar.]' },
  { id: 'metro', file: 'metro.js', charName: 'Davide', stageDirection: '[Chad is standing at a ticket machine in Cadorna metro station, looking at the map.]' },
  { id: 'duomo', file: 'duomo.js', charName: 'Francesca', stageDirection: '[Chad approaches the tourist information point in Piazza del Duomo.]' },
  { id: 'mercato', file: 'mercato.js', charName: 'Rosa', stageDirection: '[Chad approaches a market stall piled high with fresh produce, cheese, and cured meats.]' },
  { id: 'trattoria', file: 'trattoria.js', charName: 'Lorenzo', stageDirection: '[Chad arrives at the trattoria entrance for their dinner reservation.]' },
  { id: 'navigli', file: 'navigli.js', charName: 'Sofia', stageDirection: '[Chad sits down at a canal-side table at a bar in the Navigli district, early evening.]' },
  { id: 'viaDellaSpigas', file: 'viaDellaSpigas.js', charName: 'Valentina', stageDirection: '[Chad enters an elegant boutique on Via della Spiga.]' },
  { id: 'casaMilan', file: 'casaMilan.js', charName: 'Paolo', stageDirection: '[Chad enters the Casa Milan museum and merch shop.]' },
  { id: 'bartolini', file: 'bartolini.js', charName: 'Alessandro', stageDirection: '[Chad arrives at the entrance of Enrico Bartolini al MUDEC for their tasting menu reservation.]' },
  { id: 'sanSiro', file: 'sanSiro.js', charName: 'Vendor / Giuseppe', stageDirection: '[Chad arrives outside San Siro stadium on match day. The crowd is buzzing.]' },
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
// Dynamic location loader
// ---------------------------------------------------------------------------
async function loadLocation(loc) {
  const mod = await import(`file://${resolve(DATA_DIR, loc.file).replace(/\\/g, '/')}`);
  return {
    ...loc,
    keyPhrases: mod.keyPhrases,
    coreVocab: mod.coreVocab,
    extendedVocab: mod.extendedVocab || [],
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
  const MAX_TURNS = 20;

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
  while (turnCount < MAX_TURNS && !debrief) {
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
    completed: !!debrief,
    turnCount,
    transcript,
    debrief,
    stalled: !debrief && turnCount >= MAX_TURNS
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
async function runProgrammerAgent(location, findings) {
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

  if (!edits.edits || edits.edits.length === 0) {
    return { applied: false, explanation: edits.explanation || 'No edits proposed' };
  }

  // Apply edits
  let content = fileContent;
  let appliedCount = 0;
  for (const edit of edits.edits) {
    if (content.includes(edit.old)) {
      content = content.replace(edit.old, edit.new);
      appliedCount++;
    } else {
      console.log(`  WARNING: Could not find edit target: "${edit.old.slice(0, 80)}..."`);
    }
  }

  if (appliedCount > 0) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  Applied ${appliedCount}/${edits.edits.length} edits`);
  }

  return { applied: appliedCount > 0, explanation: edits.explanation, editCount: appliedCount };
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------
async function main() {
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
      const fixResult = await runProgrammerAgent(location, findings);
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
