import { useState, useEffect, useRef } from 'react';

export const useGameTimer = ({ isActive, timeLimit, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (isActive && typeof timeLimit === 'number' && timeLimit > 0) {
      // Reset timer when a timed game starts.
      endedRef.current = false;
      setTimeLeft(timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isActive, timeLimit, onEnd]);

  useEffect(() => {
    if (timeLeft === 0 && isActive && !endedRef.current) {
      endedRef.current = true;
      queueMicrotask(() => {
        onEnd?.();
      });
    }
  }, [timeLeft, isActive, onEnd]);

  return timeLeft;
};
