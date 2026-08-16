import React, { useState, useRef, TouchEvent, MouseEvent } from 'react';
import { triggerHaptic, HapticType } from '../../helpers/hapticSwipe';
import { Check, Edit, AlertCircle, ArrowLeft, ArrowRight, Smartphone } from 'lucide-react';

interface SwipeGestureContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftActionLabel?: { ar: string; en: string };
  rightActionLabel?: { ar: string; en: string };
  leftActionBg?: string; // e.g. 'bg-emerald-600'
  rightActionBg?: string; // e.g. 'bg-amber-600'
  leftActionIcon?: React.ReactNode;
  rightActionIcon?: React.ReactNode;
  threshold?: number; // default 60px
  disabled?: boolean;
  lang?: 'ar' | 'en';
  className?: string;
}

export const SwipeGestureContainer: React.FC<SwipeGestureContainerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActionLabel = { ar: 'إتمام المنجز', en: 'Complete' },
  rightActionLabel = { ar: 'تعديل التفاصيل', en: 'Edit' },
  leftActionBg = 'bg-emerald-600 text-white',
  rightActionBg = 'bg-amber-600 text-white',
  leftActionIcon,
  rightActionIcon,
  threshold = 65,
  disabled = false,
  lang = 'ar',
  className = ''
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [hapticFired, setHapticFired] = useState(false);

  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
    setHapticFired(false);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || !isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    // Determine swipe direction axis
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
        isHorizontalSwipeRef.current = false;
      }
    }

    if (isHorizontalSwipeRef.current === true) {
      // Prevent scrolling if swiping horizontally
      // Apply dampening past threshold
      let dampenedX = deltaX;
      if (Math.abs(deltaX) > threshold) {
        const overflow = Math.abs(deltaX) - threshold;
        dampenedX = (deltaX > 0 ? 1 : -1) * (threshold + overflow * 0.3);
      }
      setTranslateX(dampenedX);

      // Trigger haptic when passing threshold
      if (Math.abs(deltaX) >= threshold && !hapticFired) {
        triggerHaptic('medium');
        setHapticFired(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    setIsSwiping(false);

    if (Math.abs(translateX) >= threshold) {
      if (translateX > 0 && onSwipeRight) {
        triggerHaptic('success');
        onSwipeRight();
      } else if (translateX < 0 && onSwipeLeft) {
        triggerHaptic('success');
        onSwipeLeft();
      }
    }

    // Reset translation back to center
    setTranslateX(0);
    isHorizontalSwipeRef.current = null;
  };

  const showLeftAction = translateX < -20;
  const showRightAction = translateX > 20;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 ${className}`}>
      {/* Background action layer revealed during horizontal swipe */}
      <div className="absolute inset-0 flex justify-between items-center px-4 font-bold text-xs select-none pointer-events-none">
        {/* Right action (revealed when swiping right -> translateX > 0) */}
        <div className={`flex items-center gap-2 h-full px-4 rounded-r-xl transition-opacity duration-150 ${showRightAction ? 'opacity-100' : 'opacity-0'} ${rightActionBg}`}>
          {rightActionIcon || <Edit className="w-4 h-4" />}
          <span>{lang === 'ar' ? rightActionLabel.ar : rightActionLabel.en}</span>
        </div>

        {/* Left action (revealed when swiping left -> translateX < 0) */}
        <div className={`flex items-center gap-2 h-full px-4 rounded-l-xl transition-opacity duration-150 ml-auto ${showLeftAction ? 'opacity-100' : 'opacity-0'} ${leftActionBg}`}>
          <span>{lang === 'ar' ? leftActionLabel.ar : leftActionLabel.en}</span>
          {leftActionIcon || <Check className="w-4 h-4" />}
        </div>
      </div>

      {/* Main card layer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
        }}
        className="relative z-10 bg-white dark:bg-zinc-900 touch-pan-y select-none"
      >
        {children}
      </div>
    </div>
  );
};
