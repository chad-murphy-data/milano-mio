export default function CLDebriefScreen({ debrief, character, lifelineUsed, topic, onHome }) {
  const learned = debrief?.learned || [];
  const retry = debrief?.retry || [];
  const characterSays =
    debrief?.character_says ||
    debrief?.[`${character?.id}_says`] ||
    '';
  const topicCovered = debrief?.topic_covered || topic || '';

  return (
    <div className="screen debrief-screen cl-debrief">
      <h2>Conversazione finita</h2>

      <section className="debrief-section learned">
        <h3>Parole Nuove</h3>
        {learned.length === 0 ? (
          <p className="empty">No new vocabulary captured this session.</p>
        ) : (
          <ul>
            {learned.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="debrief-section retry">
        <h3>Riprova</h3>
        {retry.length === 0 ? (
          <p className="empty">Nothing flagged. Nice work.</p>
        ) : (
          <ul>
            {retry.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </section>

      {characterSays && (
        <section className="debrief-section marco-says">
          <h3>{character?.name || 'Character'} dice</h3>
          <blockquote>"{characterSays}"</blockquote>
        </section>
      )}

      {topicCovered && (
        <section className="debrief-section topic-section">
          <p className="topic-covered">
            <strong>Argomento:</strong> {topicCovered}
          </p>
        </section>
      )}

      {lifelineUsed && (
        <p className="lifeline-note">
          You used the lifeline this session — that's ok, it's there for a reason.
        </p>
      )}

      <button className="primary-btn" onClick={onHome}>
        Torna domani
      </button>
    </div>
  );
}
