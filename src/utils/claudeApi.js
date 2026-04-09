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
