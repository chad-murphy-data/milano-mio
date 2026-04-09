export default function BriefingPanel({ open, onToggle, scenario, difficulty }) {
  if (!scenario) return null;
  return (
    <aside className={`briefing-panel ${open ? 'open' : 'closed'}`}>
      <button className="panel-toggle" onClick={onToggle} aria-label="Toggle briefing">
        {open ? '›' : '‹'}
      </button>
      {open && (
        <div className="panel-body">
          <h3>Il tuo aiuto</h3>
          <p className="panel-scene">{scenario.shortDescription}</p>
          <table className="phrase-table">
            <tbody>
              {(scenario.keyPhrases || []).map((p) => (
                <tr key={p.it}>
                  <td className="it">{p.it}</td>
                  <td className="en">{p.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {scenario.culturalNote && (
            <div className="cultural-note">
              <strong>{scenario.culturalNote.title}</strong>
              <p>{scenario.culturalNote.body}</p>
            </div>
          )}
          <p className="panel-difficulty">Difficoltà: <em>{difficulty}</em></p>
        </div>
      )}
    </aside>
  );
}
