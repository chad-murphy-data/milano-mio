// Character memory: build prompt context from stored facts, pick topics, merge new facts.
// Pure functions — no React dependencies.

/**
 * Build a prompt-injectable string from a character's stored data.
 * @param {object} characterData — { facts, lastTopic, coveredTopics, sessionCount }
 * @returns {string} multiline string for system prompt injection, or ''
 */
export function buildMemoryContext(characterData) {
  if (!characterData || !characterData.facts || characterData.facts.length === 0) {
    return '';
  }
  const lines = characterData.facts.map((f) => `- ${f}`);
  const parts = [`WHAT YOU KNOW ABOUT CHAD SO FAR:\n${lines.join('\n')}`];
  if (characterData.coveredTopics && characterData.coveredTopics.length > 0) {
    parts.push(`Topics you've already covered: ${characterData.coveredTopics.join(', ')}`);
  }
  if (characterData.sessionCount > 0) {
    parts.push(`You've talked ${characterData.sessionCount} time${characterData.sessionCount === 1 ? '' : 's'} before.`);
  }
  return parts.join('\n');
}

/**
 * Pick a topic the character hasn't covered recently.
 * If all topics are covered, resets and picks randomly (topics recycle).
 * @param {string[]} coveredTopics — topics already discussed
 * @param {string[]} topicBank — all available topics
 * @returns {string} selected topic
 */
export function pickTopic(coveredTopics, topicBank) {
  const covered = new Set(coveredTopics || []);
  const available = topicBank.filter((t) => !covered.has(t));
  const pool = available.length > 0 ? available : topicBank;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Merge new memory from a session into existing character data.
 * @param {object} existing — current stored character data (or defaults)
 * @param {object} newMemory — { new_facts, topic_covered } from parsed response
 * @returns {object} updated character data
 */
export function updateCharacterData(existing, newMemory) {
  const base = existing || { sessionCount: 0, facts: [], lastTopic: null, coveredTopics: [] };
  const existingFacts = new Set(base.facts || []);
  const newFacts = (newMemory?.new_facts || []).filter((f) => !existingFacts.has(f));
  const topicCovered = newMemory?.topic_covered || null;

  return {
    sessionCount: base.sessionCount + 1,
    facts: [...(base.facts || []), ...newFacts],
    lastTopic: topicCovered,
    coveredTopics: topicCovered
      ? [...new Set([...(base.coveredTopics || []), topicCovered])]
      : base.coveredTopics || []
  };
}
