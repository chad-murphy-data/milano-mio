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

          const { system, messages, model, max_tokens, stream } = parsed;

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

          // When streaming, forward Anthropic's SSE body directly. The
          // reader/writer dance is needed because Node's http ServerResponse
          // wants Buffer chunks, and fetch gives us a WHATWG ReadableStream.
          if (stream) {
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            const reader = upstream.body.getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
            return;
          }

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

// Dev-only middleware that mirrors the Netlify function at /api/tts.
// Proxies to Gemini 3.1 Flash TTS; wraps the returned PCM in a WAV header
// so the browser's Audio element plays it directly. GEMINI_API_KEY and
// APP_PASSWORD are read from process.env (no VITE_ prefix) so they stay
// server-side.
const VALID_VOICES = new Set([
  'Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir', 'Leda',
  'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus',
  'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
  'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima',
  'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
]);

const GEMINI_TTS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent';

function wrapPcmAsWav(pcm, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

function ttsProxy(env) {
  return {
    name: 'tts-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
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

        const apiKey = env.GEMINI_API_KEY;
        const appPassword = env.APP_PASSWORD;

        if (!apiKey) return json({ error: 'Missing GEMINI_API_KEY in .env' }, 500);
        if (!appPassword) return json({ error: 'Missing APP_PASSWORD in .env' }, 500);

        const provided = req.headers['x-app-password'] || '';
        if (!safeEqual(String(provided), appPassword)) {
          return json({ error: 'Unauthorized' }, 401);
        }

        try {
          let body = '';
          for await (const chunk of req) body += chunk;
          const parsed = body ? JSON.parse(body) : {};
          const { text, voice, styleHint } = parsed;

          if (!text || typeof text !== 'string') return json({ error: 'Missing text' }, 400);
          if (!voice || !VALID_VOICES.has(voice)) return json({ error: 'Invalid voice' }, 400);

          const trimmed = text.length > 4000 ? text.slice(0, 4000) : text;
          const prompt = styleHint ? `${styleHint}: ${trimmed}` : trimmed;

          const upstream = await fetch(`${GEMINI_TTS_URL}?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice }
                  }
                }
              }
            })
          });

          if (!upstream.ok) {
            const errText = await upstream.text();
            return json({ error: errText || 'TTS upstream error' }, upstream.status);
          }

          const data = await upstream.json();
          const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (!inline?.data) {
            return json({ error: 'TTS response missing audio data' }, 502);
          }

          const pcm = Buffer.from(inline.data, 'base64');
          const wav = wrapPcmAsWav(pcm);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'audio/wav');
          res.end(wav);
        } catch (err) {
          json({ error: err?.message || 'proxy error' }, 500);
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), anthropicProxy(env), ttsProxy(env)],
    server: { port: 5173 }
  };
});
