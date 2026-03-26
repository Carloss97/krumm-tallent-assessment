import { useState, useEffect, useRef } from 'react';

export const useGameTimer = ({ isActive, timeLimit, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && typeof timeLimit === 'number' && timeLimit > 0) {
      // Reset timer when a timed game starts.
      setTimeLeft(timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onEnd();
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

  return timeLeft;
};
