import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 150,
  className = ''
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setShow(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShow(false);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900/95 dark:border-b-zinc-950/95 border-x-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-slate-900/95 dark:border-l-zinc-950/95 border-y-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-slate-900/95 dark:border-r-zinc-950/95 border-y-transparent border-l-transparent';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-slate-900/95 dark:border-t-zinc-950/95 border-x-transparent border-b-transparent';
    }
  };

  const getAnimationVariants = () => {
    const offset = 4;
    return {
      initial: {
        opacity: 0,
        scale: 0.95,
        x: position === 'left' ? offset : position === 'right' ? -offset : 0,
        y: position === 'top' ? offset : position === 'bottom' ? -offset : 0,
      },
      animate: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        x: position === 'left' ? offset : position === 'right' ? -offset : 0,
        y: position === 'top' ? offset : position === 'bottom' ? -offset : 0,
      }
    };
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {show && content && (
          <motion.div
            variants={getAnimationVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute z-[100] px-2.5 py-1.5 text-[10px] font-black text-slate-100 dark:text-zinc-100 bg-slate-900/95 dark:bg-zinc-950/95 border border-zinc-800/80 rounded-lg shadow-lg pointer-events-none select-none max-w-xs text-center leading-normal whitespace-nowrap ${getPositionClasses()}`}
          >
            {content}
            <div className={`absolute border-4 ${getArrowClasses()}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
