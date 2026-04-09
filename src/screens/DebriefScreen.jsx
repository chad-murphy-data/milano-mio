export default function DebriefScreen({ debrief, scenario, vocabulary, onHome }) {
  const learned = debrief?.learned || [];
  const retry = debrief?.retry || [];
  const characterSays =
    debrief?.character_says ||
    debrief?.[scenario?.characterSaysKey] ||
    debrief?.marco_says ||
    '';
  const characterName = scenario?.characterName || 'Marco';

  return (
    <div className="screen debrief-screen">
      <h2>La sessione è finita</h2>

      <section className="debrief-section learned">
        <h3>Cosa hai imparato</h3>
        {learned.length === 0 ? (
          <p className="empty">Nothing solid yet — that's ok. Try again.</p>
        ) : (
          <ul>
            {learned.map((w, i) => (
              <li key={i}>
                {w}
                <WordTrajectory word={w} vocabulary={vocabulary} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="debrief-section retry">
        <h3>Riprova</h3>
        {retry.length === 0 ? (
          <p className="empty">Nothing flagged for review. Nice.</p>
        ) : (
          <ul>
            {retry.map((w, i) => (
              <li key={i}>
                {w}
                <WordTrajectory word={w} vocabulary={vocabulary} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {characterSays && (
        <section className="debrief-section marco-says">
          <h3>{characterName} dice</h3>
          <blockquote>"{characterSays}"</blockquote>
        </section>
      )}

      <button className="primary-btn" onClick={onHome}>
        Torna domani
      </button>
    </div>
  );
}

function WordTrajectory({ word, vocabulary }) {
  if (!vocabulary) return null;
  const key = word.split('—')[0].trim().toLowerCase();
  const entry = vocabulary[key];
  if (!entry || !entry.seenCount) return null;
  return (
    <span className="trajectory">
      {' '}· seen {entry.seenCount}x · {entry.state?.toLowerCase()}
    </span>
  );
}
