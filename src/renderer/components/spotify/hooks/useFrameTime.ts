import { useRef, useCallback } from 'react';

export const useFrameTime = () => {
  const frameTimeRef = useRef<number>(performance.now());
  const lastFrameTimeRef = useRef<number>(performance.now());

  const getElapsed = useCallback(() => {
    const now = performance.now();
    const elapsed = Math.min(now - lastFrameTimeRef.current, 16.67);
    lastFrameTimeRef.current = now;
    frameTimeRef.current = now;
    return elapsed;
  }, []);

  return { getElapsed };
};