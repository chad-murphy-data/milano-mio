import { useState, useRef, useEffect } from 'react';
import { sendMessage, AuthError } from '../utils/claudeApi.js';

const SYSTEM_PROMPT = `You are a friendly, encouraging Italian language tutor named Professoressa Elena.
Your student is learning Italian through an immersive conversation app set in Milan.

Guidelines:
- Answer questions about Italian grammar, vocabulary, pronunciation, and culture
- Provide useful phrases with both Italian and English translations
- When giving phrases, format them clearly: **Italian** — English
- Keep answers concise but helpful (2-4 sentences, plus examples)
- If the student writes in Italian, gently correct any mistakes and praise what they got right
- Suggest related phrases they might find useful
- Be warm and encouraging — use occasional Italian expressions like "Bravissimo!" or "Perfetto!"
- If asked about Milan specifically, share cultural tips relevant to their learning scenarios
- Do NOT use [DEBRIEF], [HINT], or [CHARACTER_MEMORY] tags — this is a separate tutoring chat`;

export default function ItalianTutor({ onAuthLost }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendMessage(SYSTEM_PROMPT, updated, 'normale');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      if (err instanceof AuthError) {
        onAuthLost?.();
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Mi dispiace, something went wrong. Try again!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className="tutor-fab"
        onClick={() => setOpen((o) => !o)}
        title="Italian Tutor"
      >
        {open ? '✕' : '📚'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="tutor-panel">
          <div className="tutor-header">
            <span className="tutor-title">Professoressa Elena</span>
            <span className="tutor-subtitle">Ask me anything about Italian!</span>
          </div>

          <div className="tutor-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="tutor-welcome">
                <p>Ciao! I'm your Italian tutor. Ask me about:</p>
                <ul>
                  <li>Phrases & vocabulary</li>
                  <li>Grammar questions</li>
                  <li>Translations</li>
                  <li>Cultural tips about Milan</li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`tutor-msg tutor-msg-${m.role}`}>
                <div className="tutor-msg-who">
                  {m.role === 'user' ? 'You' : 'Elena'}
                </div>
                <div className="tutor-msg-text">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="tutor-msg tutor-msg-assistant">
                <div className="tutor-msg-who">Elena</div>
                <div className="tutor-msg-text tutor-typing">Un momento...</div>
              </div>
            )}
          </div>

          <form className="tutor-input" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. How do I order coffee?"
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Invia
            </button>
          </form>
        </div>
      )}
    </>
  );
}
