import { useEffect, useState } from 'react';

type UseTypewriterTextParams = {
  text: string;
  delayMs: number;
  enabled?: boolean;
  resetKey?: string;
};

type UseTypewriterTextResult = {
  visibleText: string;
  isComplete: boolean;
  skip: () => void;
  reset: () => void;
};

export function useTypewriterText({ text, delayMs, enabled = true, resetKey = text }: UseTypewriterTextParams): UseTypewriterTextResult {
  const [visibleLength, setVisibleLength] = useState(() => (!enabled || delayMs === 0 ? text.length : 0));

  useEffect(() => {
    setVisibleLength(!enabled || delayMs === 0 ? text.length : 0);
  }, [text, enabled, resetKey]);

  useEffect(() => {
    if (!enabled || delayMs === 0) {
      setVisibleLength(text.length);
      return undefined;
    }
    if (visibleLength >= text.length) return undefined;

    const timer = window.setTimeout(() => {
      setVisibleLength((current) => Math.min(text.length, current + 1));
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [text, delayMs, enabled, visibleLength]);

  return {
    visibleText: text.slice(0, visibleLength),
    isComplete: visibleLength >= text.length,
    skip: () => setVisibleLength(text.length),
    reset: () => setVisibleLength(!enabled || delayMs === 0 ? text.length : 0),
  };
}
