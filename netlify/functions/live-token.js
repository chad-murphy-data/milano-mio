// Netlify Function: mint a short-lived ephemeral auth token so the
// browser can connect directly to Gemini Live over WebSocket without
// exposing the master GEMINI_API_KEY. Tokens are single-use and expire
// in ~30 minutes; a new-session window of 2 minutes limits replay.

const AUTH_TOKENS_URL =
  'https://generativelanguage.googleapis.com/v1alpha/auth_tokens';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  const appPassword = Netlify.env.get('APP_PASSWORD');

  if (!apiKey) return json({ error: 'Missing GEMINI_API_KEY in Netlify env vars.' }, 500);
  if (!appPassword) return json({ error: 'Missing APP_PASSWORD in Netlify env vars.' }, 500);

  const provided = req.headers.get('x-app-password') || '';
  if (!safeEqual(provided, appPassword)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();

  try {
    const upstream = await fetch(`${AUTH_TOKENS_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        uses: 1,
        expireTime,
        newSessionExpireTime
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return json({ error: errText || 'auth_tokens upstream error' }, upstream.status);
    }

    const data = await upstream.json();
    // Google returns { name: "authTokens/abc123..." } — the `name` is the
    // actual token string the client passes via ?access_token=...
    return new Response(JSON.stringify({ token: data.name || data.token || '' }), {
      status: 200,
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
