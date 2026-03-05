
import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  renderWithMarkdown?: boolean;
}

export function TypewriterText({ text, speed = 0.0001, onComplete, renderWithMarkdown = false }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  if (renderWithMarkdown) {
    return (
      <div className="inline-block">
        <MarkdownRenderer content={displayedText} />
        {currentIndex < text.length && (
          <span className="ml-1 w-2 h-5 bg-primary animate-pulse inline-block"></span>
        )}
      </div>
    );
  }

  return (
    <span className="inline-block">
      {displayedText}
      {currentIndex < text.length && (
        <span className="ml-1 w-2 h-5 bg-primary animate-pulse inline-block"></span>
      )}
    </span>
  );
}
