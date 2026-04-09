export default function MicButton({ listening, disabled, onToggle, interim }) {
  return (
    <div className="mic-wrap">
      <button
        className={`mic-button ${listening ? 'listening' : ''}`}
        disabled={disabled}
        onClick={onToggle}
      >
        {listening ? '■ Invia' : '🎤 Parla'}
      </button>
      {interim && <div className="mic-interim">{interim}</div>}
    </div>
  );
}
