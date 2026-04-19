const MODELS = {
  facile: 'claude-haiku-4-5',
  normale: 'claude-haiku-4-5',
  difficile: 'claude-sonnet-4-6'
};
const PW_KEY = 'milano-mio-pw';

export class AuthError extends Error {
  constructor(msg = 'Unauthorized') {
    super(msg);
    this.name = 'AuthError';
  }
}

export function getSavedPassword() {
  try {
    return window.localStorage.getItem(PW_KEY) || '';
  } catch {
    return '';
  }
}

export function savePassword(pw) {
  try {
    window.localStorage.setItem(PW_KEY, pw);
  } catch {}
}

export function clearPassword() {
  try {
    window.localStorage.removeItem(PW_KEY);
  } catch {}
}

async function callProxy(body, password) {
  const pw = password ?? getSavedPassword();
  const res = await fetch('/api/marco', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-app-password': pw
    },
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    clearPassword();
    throw new AuthError('Wrong password.');
  }
  return res;
}

// Cheap verification used by the login screen — doesn't touch Anthropic.
export async function verifyPassword(pw) {
  try {
    const res = await callProxy({ ping: true }, pw);
    if (res.ok) {
      savePassword(pw);
      return true;
    }
    return false;
  } catch (e) {
    if (e instanceof AuthError) return false;
    throw e;
  }
}

/**
 * Send a conversation turn to Claude via the auth'd proxy.
 * Haiku for Facile/Normale (cheap, fast), Sonnet for Difficile (nuanced character).
 * @param {string} systemPrompt
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {'facile'|'normale'|'difficile'} difficulty
 */
export async function sendMessage(systemPrompt, messages, difficulty = 'normale') {
  const model = MODELS[difficulty] || MODELS.normale;
  const res = await callProxy({
    model,
    max_tokens: 500,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content }))
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message || j?.error || '';
    } catch {}
    throw new Error(`Connection failed (${res.status}). ${detail}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
  return text;
}

// Backward-compatible alias used by ConversationScreen.
export const sendToMarco = sendMessage;

// Prepended to every in-character system prompt. Stops the model from
// pretending its real-life character has physical constraints (pulling a
// shot, cooking, walking to get something) and silently waiting — which
// would strand the user in a turn-taking simulator with no way forward.
const AI_META_RULE = `AI CONVERSATION RULE — OVERRIDES ALL SCENARIO INSTRUCTIONS TO THE CONTRARY:
You are a turn-taking AI running an Italian-language simulator. Each response is a SINGLE compact beat of dialogue — one piece of text, never repeated, never restated. Do not output the same line twice in the same response, and do not produce two versions of the same beat (e.g. a "pre-wait" and "post-wait" variant).

There are no real pauses in this simulator: no drinks actually being made, no rooms actually being unlocked, no packages actually being wrapped. If your character would naturally wait or pause in real life, skip straight to the post-pause line — and pick ONE line to say, not both sides of the pause. Never tell the user to wait, to hold on, or to give you a moment: they cannot advance without your reply, so asking them to wait strands the conversation.

---

`;

/**
 * Streaming variant. Yields text chunks as Anthropic's SSE stream arrives,
 * letting callers pipeline TTS (and progressive UI display) against a
 * response that Claude is still generating. Ends by returning the full
 * accumulated text so callers can still do post-stream parsing (debrief
 * block, hint tag, english tag, etc.).
 */
export async function* sendMessageStream(systemPrompt, messages, difficulty = 'normale') {
  const model = MODELS[difficulty] || MODELS.normale;
  const pw = getSavedPassword();
  const res = await fetch('/api/marco', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-app-password': pw
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: AI_META_RULE + systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true
    })
  });

  if (res.status === 401) {
    clearPassword();
    throw new AuthError('Wrong password.');
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Connection failed (${res.status}). ${txt}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank lines; within an event, data lines
    // are prefixed with `data: `. Anthropic sends JSON payloads per event.
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const ev of events) {
      for (const line of ev.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (!data || data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (
            parsed.type === 'content_block_delta' &&
            parsed.delta?.type === 'text_delta' &&
            parsed.delta.text
          ) {
            full += parsed.delta.text;
            yield parsed.delta.text;
          }
        } catch {
          // Skip malformed event — Anthropic occasionally sends keep-alives.
        }
      }
    }
  }

  return full;
}
