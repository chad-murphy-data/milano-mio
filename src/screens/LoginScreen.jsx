import { useState } from 'react';
import { verifyPassword } from '../utils/claudeApi.js';

export default function LoginScreen({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyPassword(pw.trim());
      if (ok) {
        onUnlock();
      } else {
        setError('Non funziona. Try again.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen login-screen">
      <header>
        <h1>Milano Mio</h1>
        <p className="subtitle">Il tuo viaggio inizia qui.</p>
      </header>
      <form className="login-card" onSubmit={handleSubmit}>
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
          disabled={busy}
          autoComplete="current-password"
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="primary-btn" disabled={busy || !pw.trim()}>
          {busy ? 'Verifico...' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
