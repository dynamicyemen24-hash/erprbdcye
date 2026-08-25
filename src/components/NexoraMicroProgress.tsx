import React, { useEffect, useRef, useState } from 'react';
import { fetchProgress } from '../lib/fetchProgress';

/**
 * NexoraMicroProgress — ultra-light 2px determinate progress bar.
 * Driven by REAL network activity (every /api request), not fake timers.
 * Sits at the very top edge; zero layout shift, zero toast noise.
 */
const NexoraMicroProgressInner: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return fetchProgress.subscribe(({ active, progress: p }) => {
      if (active) {
        if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
        setVisible(true);
        setProgress(Math.max(p, 4)); // visible sliver on start
      } else {
        setProgress(100);
        hideTimer.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 350);
      }
    });
  }, []);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100001] pointer-events-none h-[2px] overflow-hidden"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 250ms ease' }}
    >
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.7)] will-change-transform"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 200ms ease-out' : 'width 300ms cubic-bezier(0.25,1,0.5,1)'
        }}
      />
    </div>
  );
};

export const NexoraMicroProgress = React.memo(NexoraMicroProgressInner);
export default NexoraMicroProgress;
