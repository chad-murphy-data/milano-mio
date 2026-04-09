export default function WhisperPrompt({ hint }) {
  if (!hint) return null;
  return (
    <div className="whisper-prompt">
      <span className="whisper-label">psst...</span>
      <span className="whisper-text">{hint}</span>
    </div>
  );
}
