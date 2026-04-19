// Netlify Function: server-side proxy to the Anthropic Messages API.
// - API key (ANTHROPIC_API_KEY) lives in Netlify env, never shipped to the browser.
// - App password (APP_PASSWORD) gates access: client must send x-app-password header.
// Mirrors the Vite dev middleware so /api/marco behaves identically in dev and prod.

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
  const appPassword = Netlify.env.get('APP_PASSWORD');

  if (!apiKey) {
    return json({ error: 'Missing ANTHROPIC_API_KEY in Netlify env vars.' }, 500);
  }
  if (!appPassword) {
    return json({ error: 'Missing APP_PASSWORD in Netlify env vars.' }, 500);
  }

  // Password check — constant-time comparison to resist timing attacks.
  const provided = req.headers.get('x-app-password') || '';
  if (!safeEqual(provided, appPassword)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Lightweight ping used by the login screen to verify the password
  // without burning tokens against the Anthropic API.
  if (payload?.ping === true) {
    return json({ ok: true }, 200);
  }

  const { system, messages, model, max_tokens, stream } = payload || {};

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: max_tokens || 500,
        system,
        messages,
        ...(stream ? { stream: true } : {})
      })
    });

    // When streaming, pipe Anthropic's SSE body straight through. The
    // client parses the event stream incrementally so the first tokens
    // reach the TTS pipeline before Claude has finished generating.
    if (stream) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive'
        }
      });
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    return json({ error: err?.message || 'proxy error' }, 500);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
