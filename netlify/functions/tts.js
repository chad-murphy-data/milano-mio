// Netlify Function: server-side proxy to Google's Gemini 3.1 Flash TTS.
// - GEMINI_API_KEY lives in Netlify env, never shipped to the browser.
// - APP_PASSWORD gates access (same pattern as marco.js).
// - Gemini returns raw 24kHz 16-bit mono PCM as base64 JSON; we wrap it
//   in a WAV header and return audio/wav so the HTMLAudioElement in the
//   hook plays it without changes.
//
// Request:  POST { text: string, voice: string, styleHint?: string }
// Response: audio/wav bytes (empty body on error + JSON error header)

const MAX_INPUT_CHARS = 4000;

// Full roster of Gemini 3.1 prebuilt voices. Keeping the set in sync
// with what the model accepts avoids silent 400s at request time.
const VALID_VOICES = new Set([
  'Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir', 'Leda',
  'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus',
  'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
  'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima',
  'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
]);

const GEMINI_TTS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent';

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

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { text, voice, styleHint } = payload || {};
  if (!text || typeof text !== 'string') return json({ error: 'Missing text' }, 400);
  if (!voice || !VALID_VOICES.has(voice)) return json({ error: 'Invalid voice' }, 400);

  // Optional inline style prompt — Gemini 3.1 supports natural-language
  // direction prefixes like "Say cheerfully:" that shape delivery without
  // adding any spoken text. We only prepend when the caller asked for it.
  const trimmed = text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text;
  const prompt = styleHint ? `${styleHint}: ${trimmed}` : trimmed;

  try {
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
    return new Response(wav, {
      status: 200,
      headers: { 'content-type': 'audio/wav' }
    });
  } catch (err) {
    return json({ error: err?.message || 'proxy error' }, 500);
  }
};

// Prepend a minimal 44-byte RIFF/WAVE header so the browser recognizes
// the PCM payload as playable audio. Gemini hands back 24kHz / 16-bit /
// mono; anything else would need sample-rate conversion on the client.
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
