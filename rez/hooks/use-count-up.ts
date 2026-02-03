import { useEffect, useState } from 'react';

/**
 * Animates a number from 0 (or current value) to the target value with a fast-counting effect.
 * @param target - The value to count up to
 * @param durationMs - Animation duration in milliseconds (default 500)
 * @param enabled - Whether the animation should run (default true when target > 0)
 */
export function useCountUp(
  target: number,
  durationMs: number = 500,
  enabled: boolean = true
): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!enabled || target <= 0) {
      setDisplayValue(target);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, enabled]);

  return displayValue;
}
