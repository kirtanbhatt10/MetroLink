import { useCallback, useEffect, useState } from 'react';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export function useSpeech() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('ml.speech') === '1'; } catch { return false; }
  });
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => { try { localStorage.setItem('ml.speech', enabled ? '1' : '0'); } catch { /* ignore */ } }, [enabled]);

  const stop = useCallback(() => {
    if (speechSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!speechSupported || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  useEffect(() => () => { if (speechSupported) window.speechSynthesis.cancel(); }, []);

  return { supported: speechSupported, enabled, setEnabled, speaking, speak, stop };
}
