import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only middleware that mirrors the Netlify function at /api/marco.
// ANTHROPIC_API_KEY and APP_PASSWORD are read from process.env (no VITE_ prefix)
// so they never reach the client bundle.
function anthropicProxy(env) {
  return {
    name: 'anthropic-proxy',
    configureServer(server) {
      server.middlewares.use('/api/marco', async (req, res) => {
        const json = (obj, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const apiKey = env.ANTHROPIC_API_KEY;
        const appPassword = env.APP_PASSWORD;

        if (!apiKey) {
          return json({ error: 'Missing ANTHROPIC_API_KEY in .env' }, 500);
        }
        if (!appPassword) {
          return json({ error: 'Missing APP_PASSWORD in .env' }, 500);
        }

        const provided = req.headers['x-app-password'] || '';
        if (!safeEqual(String(provided), appPassword)) {
          return json({ error: 'Unauthorized' }, 401);
        }

        try {
          let body = '';
          for await (const chunk of req) body += chunk;
          const parsed = body ? JSON.parse(body) : {};

          if (parsed?.ping === true) {
            return json({ ok: true }, 200);
          }

          const { system, messages, model, max_tokens } = parsed;

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
              messages
            })
          });
          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(text);
        } catch (err) {
          json({ error: err?.message || 'proxy error' }, 500);
        }
      });
    }
  };
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), anthropicProxy(env)],
    server: { port: 5173 }
  };
});
