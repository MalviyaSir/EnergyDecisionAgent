import { useEffect, useRef, useState } from 'react';

export function useCountUp(value: number, duration = 900) {
  const [displayValue, setDisplayValue] = useState(0);
  const displayValueRef = useRef(0);

  useEffect(() => {
    let frame = 0;
    let animationFrame = 0;
    const totalFrames = Math.max(1, Math.round(duration / 16));
    const startValue = displayValueRef.current;
    const delta = value - startValue;

    const animate = () => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = startValue + delta * eased;
      displayValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, value]);

  return displayValue;
}
