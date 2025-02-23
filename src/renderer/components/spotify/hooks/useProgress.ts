import { useState, useRef, useEffect } from 'react';

export const useProgress = (currentTime: number, duration: number) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(performance.now());

  useEffect(() => {
    const updateProgress = () => {
      const now = performance.now();
      const targetValue = (currentTime / duration) * 100;
      
      if (now - lastUpdateRef.current >= 16.67) {
        setValue(prev => {
          const diff = targetValue - prev;
          return Math.abs(diff) < 0.1 ? prev : prev + diff * 0.3;
        });
        lastUpdateRef.current = now;
      }
      
      frameRef.current = requestAnimationFrame(updateProgress);
    };

    frameRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [currentTime, duration]);

  return value;
};