export default function BriefingScreen({ scenario, difficulty, retryWords, onContinue, onBack }) {
  if (!scenario) return null;
  return (
    <div className="screen briefing-screen">
      <button className="back-btn" onClick={onBack}>← Indietro</button>
      <h2>{scenario.title}</h2>
      <p className="scene">{scenario.sceneDescription}</p>

      {retryWords && retryWords.length > 0 && (
        <section className="last-time">
          <h3>L'ultima volta...</h3>
          <p>These words came up before and you struggled a bit. {scenario.characterName} might bring them up again.</p>
          <ul>
            {retryWords.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      <h3>What {scenario.characterName} might ask — and what you might say</h3>
      <table className="phrase-table">
        <thead>
          <tr>
            <th>Italian</th>
            <th>English</th>
            {difficulty === 'facile' && <th>Pronunciation</th>}
          </tr>
        </thead>
        <tbody>
          {(scenario.keyPhrases || []).map((p) => (
            <tr key={p.it}>
              <td className="it">{p.it}</td>
              <td className="en">{p.en}</td>
              {difficulty === 'facile' && <td className="phon">{p.phon}</td>}
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

      <button className="primary-btn" onClick={onContinue}>Andiamo!</button>
    </div>
  );
}
