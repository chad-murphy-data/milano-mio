import { useEffect, useRef, useState } from 'react';

function TappableWord({ word, mark, onTap }) {
  const cls = ['word-tap', mark && `word-${mark}`].filter(Boolean).join(' ');
  return (
    <span className={cls} onClick={onTap}>
      {word}{' '}
    </span>
  );
}

function TranslationReveal({ english }) {
  const [open, setOpen] = useState(false);
  if (!english) return null;
  return (
    <div className="line-translate-row">
      <button className="translate-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'hide translation' : 'show translation'}
      </button>
      <div className={`line-english ${open ? 'open' : ''}`}>{english}</div>
    </div>
  );
}

// Split text into segments: plain dialogue vs ~stage directions~
function parseSegments(text) {
  const parts = text.split(/(~[^~]+~)/g);
  return parts.filter(Boolean).map((part) => {
    if (part.startsWith('~') && part.endsWith('~')) {
      return { type: 'stage', text: part.slice(1, -1).trim() };
    }
    return { type: 'dialogue', text: part };
  });
}

function CharacterLine({ text, lineIdx, wordMarks, onWordTap }) {
  const segments = parseSegments(text);
  let wordCounter = 0;

  return segments.map((seg, sIdx) => {
    if (seg.type === 'stage') {
      return (
        <span key={`s-${sIdx}`} className="stage-direction">{seg.text}</span>
      );
    }
    // Dialogue: split into tappable words
    const words = seg.text.split(/(\s+)/).filter(Boolean);
    return words.map((token) => {
      if (/^\s+$/.test(token)) return null;
      const wIdx = wordCounter++;
      const key = `${lineIdx}-${wIdx}`;
      return (
        <TappableWord
          key={key}
          word={token}
          mark={wordMarks[key] || null}
          onTap={() => onWordTap?.(key, token)}
        />
      );
    });
  });
}

export default function Transcript({
  lines,
  characterName = 'Marco',
  wordMarks = {},
  onWordTap
}) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="transcript" ref={scrollRef}>
      {lines.map((line, lineIdx) => {
        const isUser = line.role === 'user';
        return (
          <div key={lineIdx} className={`line line-${isUser ? 'user' : 'character'}`}>
            <div className="line-who">{isUser ? 'Tu' : characterName}</div>
            <div className="line-text">
              {isUser ? (
                line.text
              ) : (
                <CharacterLine
                  text={line.text}
                  lineIdx={lineIdx}
                  wordMarks={wordMarks}
                  onWordTap={onWordTap}
                />
              )}
            </div>
            {!isUser && <TranslationReveal english={line.english} />}
          </div>
        );
      })}
      {lines.length === 0 && (
        <div className="line-hint">{characterName} sta per salutarti...</div>
      )}
    </div>
  );
}
