// QaExportButton — dev-only affordance for getting captured Live session
// transcripts out of localStorage and into a JSON file the QA pipeline can
// ingest. Mounted on HomeScreen, gated on `import.meta.env.DEV` so it
// never ships to production builds.
//
// LiveConversationScreen.jsx writes one entry per finished conversation
// under `mm_qa_sessions:<scenarioId>` (capped at 20 per scenario). This
// button walks every such key, bundles them into a single
// `{ exportedAt, sessions: [...] }` JSON, and triggers a download.
//
// Once downloaded:
//   node scripts/qa-pipeline.mjs analyze caffeLive --from=real:./mm-qa-sessions-<ts>.json

export default function QaExportButton() {
  if (!import.meta.env.DEV) return null;

  const handleExport = () => {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('mm_qa_sessions:')) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(arr)) sessions.push(...arr);
      } catch {
        // ignore corrupt entries
      }
    }
    if (!sessions.length) {
      alert('No captured sessions yet. Finish at least one Live conversation first.');
      return;
    }
    const blob = new Blob(
      [JSON.stringify({ exportedAt: Date.now(), sessions }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mm-qa-sessions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirm('Clear all captured QA sessions from this browser?')) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mm_qa_sessions:')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    alert(`Cleared ${keys.length} key(s).`);
  };

  return (
    <div
      className="qa-export-dev"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        display: 'flex',
        gap: 8,
        zIndex: 9999,
        fontSize: 12,
        opacity: 0.7
      }}
    >
      <button onClick={handleExport} style={{ padding: '4px 10px', fontSize: 12 }}>
        Export QA bundle
      </button>
      <button onClick={handleClear} style={{ padding: '4px 10px', fontSize: 12 }}>
        Clear
      </button>
    </div>
  );
}
