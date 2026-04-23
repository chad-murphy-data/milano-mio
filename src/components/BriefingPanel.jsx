// `live` prop, when true, opts the panel into the full-bleed drawer
// styling (fixed position, slide in from the right edge, overlays the
// words sidebar). Used by LiveConversationScreen; the Claude
// ConversationScreen omits the prop and gets the original grid-column
// behavior.
export default function BriefingPanel({ open, onToggle, scenario, difficulty, live = false }) {
  if (!scenario) return null;
  // Body always rendered in live mode so the drawer slide-out animation
  // shows content as it slides in (rather than popping it in after).
  // Toggle button reverses direction in live mode since the panel slides
  // OUT to the right when closed.
  const showBody = open || live;
  const closedArrow = live ? '‹' : '‹';
  const openArrow = live ? '›' : '›';
  return (
    <aside className={`briefing-panel ${live ? 'live-drawer' : ''} ${open ? 'open' : 'closed'}`}>
      <button className="panel-toggle" onClick={onToggle} aria-label="Toggle briefing">
        {open ? openArrow : closedArrow}
      </button>
      {showBody && (
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
