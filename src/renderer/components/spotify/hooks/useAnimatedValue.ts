import { useState, useRef, useEffect } from 'react';

export const useAnimatedValue = (target: number, duration: number) => {
  const [value, setValue] = useState(target);
  const frameRef = useRef<number>();
  const lastUpdateRef = useRef(performance.now());
  const lastValueRef = useRef(target);

  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      if (now - lastUpdateRef.current >= 16.67) { // Cap at 60fps
        const diff = target - lastValueRef.current;
        if (Math.abs(diff) > 0.1) {
          // Enhanced smoothing for more natural motion
          const smoothingFactor = Math.min(0.3, Math.abs(diff) / 100);
          const newValue = lastValueRef.current + (diff * smoothingFactor);
          lastValueRef.current = newValue;
          setValue(newValue);
        }
        lastUpdateRef.current = now;
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target]);

  return value;
};