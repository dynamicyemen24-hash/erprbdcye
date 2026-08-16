import { useEffect, useRef, useState } from 'react';

interface UseSessionTimeoutProps {
  timeoutMinutes?: number;
  onTimeout: () => void;
  isActive: boolean;
}

export function useSessionTimeout({ timeoutMinutes = 30, onTimeout, isActive }: UseSessionTimeoutProps) {
  const [isWarning, setIsWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const warningRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = timeoutMs - (5 * 60 * 1000); // Warn 5 minutes before timeout

  const resetTimers = () => {
    if (!isActive) return;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    setIsWarning(false);

    warningRef.current = setTimeout(() => {
      setIsWarning(true);
    }, warningMs);

    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  };

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimers();

    // Initial setup
    resetTimers();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, timeoutMinutes]);

  return { isWarning, resetSession: resetTimers };
}
