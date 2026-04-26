export default function DebriefScreen({
  debrief,
  scenario,
  vocabulary,
  onHome,
  // Number of words currently in Gabriella's active queue. Drives the
  // "before you go" CTA at the bottom of the debrief.
  activeQueueSize = 0,
  // Threshold at which Gabriella has enough material for a real lesson.
  // Same constant the map badge uses (LESSON_THRESHOLD in vocabularyEngine).
  lessonThreshold = 10,
  // Handler to jump straight into Gabriella's apartment from the CTA.
  // Optional — if not provided, the CTA hides itself.
  onVisitGabriella
}) {
  const learned = debrief?.learned || [];
  const retry = debrief?.retry || [];
  const characterSays =
    debrief?.character_says ||
    debrief?.[scenario?.characterSaysKey] ||
    debrief?.marco_says ||
    '';
  const characterName = scenario?.characterName || 'Marco';
  // Don't suggest going to Gabriella if we *just* came from her — would
  // be a confusing loop.
  const showGabriellaCTA =
    onVisitGabriella &&
    activeQueueSize >= lessonThreshold &&
    scenario?.id !== 'gabriellaApartment';

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

      {showGabriellaCTA && (
        <section className="gabriella-cta">
          <h3>Prima di uscire…</h3>
          <p>
            Hai <strong>{activeQueueSize} parole</strong> nuove nel tuo
            quaderno. Vuoi passare da Gabriella per ripassarle insieme?
          </p>
          <div className="gabriella-cta-row">
            <button className="primary-btn" onClick={onVisitGabriella}>
              Da Gabriella
            </button>
            <button className="link-btn" onClick={onHome}>
              Magari un'altra volta →
            </button>
          </div>
        </section>
      )}

      {!showGabriellaCTA && (
        <button className="primary-btn" onClick={onHome}>
          Torna domani
        </button>
      )}
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
