import { useRef, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function useSound(url: string, volume: number = 0.5) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url, volume]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      // Autoplay can legitimately be blocked by the browser; keep this quiet
      // in normal builds and only surface it while debugging.
      audioRef.current.play().catch(err => logger.debug('Audio play failed:', err));
    }
  }, []);

  return play;
}