/**
 * NexoraOS™ Haptic Feedback & Touch Swipe Gestures Engine
 *
 * Production-grade touch gesture and haptic feedback engine
 * for mobile field screens and responsive interfaces.
 *
 * Features:
 * - SSR-safe Haptic API
 * - Configurable haptic patterns
 * - Horizontal & vertical swipe detection
 * - Distance threshold
 * - Velocity detection
 * - Direction arbitration
 * - Live swipe callbacks
 * - Optional haptic feedback
 * - Passive touch listeners for optimal scrolling performance
 * - Full event listener cleanup
 * - No framework dependency
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

export type SwipeDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down';

export interface TouchPosition {
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

export interface SwipeEvent {
  readonly direction: SwipeDirection;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly distance: number;
  readonly duration: number;
  readonly velocity: number;
  readonly start: TouchPosition;
  readonly end: TouchPosition;
}

export interface SwipeConfig {
  /**
   * Minimum movement in pixels required to qualify as a swipe.
   * Default: 45
   */
  threshold?: number;

  /**
   * Maximum perpendicular movement ratio for horizontal swipes.
   * Example: 0.8 means vertical movement cannot exceed 80%
   * of horizontal movement.
   *
   * Default: 0.8
   */
  maxVerticalRatio?: number;

  /**
   * Maximum perpendicular movement ratio for vertical swipes.
   *
   * Default: 0.8
   */
  maxHorizontalRatio?: number;

  /**
   * Minimum swipe velocity in px/ms.
   *
   * Default: 0.15
   */
  minVelocity?: number;

  /**
   * Maximum gesture duration in milliseconds.
   *
   * Default: 1000
   */
  maxDuration?: number;

  /**
   * Enable haptic feedback when a swipe is detected.
   *
   * Default: false
   */
  enableHaptic?: boolean;

  /**
   * Haptic pattern used when a swipe is detected.
   *
   * Default: light
   */
  hapticType?: HapticType;

  /**
   * Called when the finger moves during the gesture.
   */
  onSwiping?: (
    deltaX: number,
    deltaY: number,
    position: TouchPosition
  ) => void;

  /**
   * Called when a valid swipe is detected.
   */
  onSwipe?: (event: SwipeEvent) => void;

  onSwipeLeft?: (event: SwipeEvent) => void;
  onSwipeRight?: (event: SwipeEvent) => void;
  onSwipeUp?: (event: SwipeEvent) => void;
  onSwipeDown?: (event: SwipeEvent) => void;
}

export interface SwipeEngine {
  /**
   * Remove all event listeners and release resources.
   */
  destroy(): void;

  /**
   * Enable gesture detection.
   */
  enable(): void;

  /**
   * Disable gesture detection.
   */
  disable(): void;

  /**
   * Whether the engine is currently enabled.
   */
  readonly enabled: boolean;
}

/**
 * Trigger haptic feedback on supported mobile devices.
 *
 * Returns true when the browser accepted the vibration request.
 */
export function triggerHaptic(
  type: HapticType = 'light'
): boolean {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.vibrate !== 'function'
  ) {
    return false;
  }

  const patterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: [15, 30, 15],
    heavy: [25, 40, 25],
    success: [15, 30, 20, 40, 30],
    warning: [40, 80, 40],
    error: [60, 100, 60, 100, 60],
  };

  try {
    return navigator.vibrate(patterns[type]);
  } catch (error) {
    if (
      typeof console !== 'undefined' &&
      typeof console.debug === 'function'
    ) {
      console.debug(
        'NexoraOS™: Haptic feedback unavailable.',
        error
      );
    }

    return false;
  }
}

/**
 * Normalize configuration with production-safe defaults.
 */
function normalizeConfig(
  config: SwipeConfig = {}
): Required<
  Pick<
    SwipeConfig,
    | 'threshold'
    | 'maxVerticalRatio'
    | 'maxHorizontalRatio'
    | 'minVelocity'
    | 'maxDuration'
    | 'enableHaptic'
    | 'hapticType'
  >
> {
  return {
    threshold: Math.max(config.threshold ?? 45, 1),

    maxVerticalRatio: Math.max(
      config.maxVerticalRatio ?? 0.8,
      0
    ),

    maxHorizontalRatio: Math.max(
      config.maxHorizontalRatio ?? 0.8,
      0
    ),

    minVelocity: Math.max(
      config.minVelocity ?? 0.15,
      0
    ),

    maxDuration: Math.max(
      config.maxDuration ?? 1000,
      1
    ),

    enableHaptic: config.enableHaptic ?? false,

    hapticType: config.hapticType ?? 'light',
  };
}

/**
 * Extract the primary touch point from a TouchEvent.
 */
function getTouchPosition(
  event: TouchEvent
): TouchPosition | null {
  const touch = event.touches[0] ?? event.changedTouches[0];

  if (!touch) {
    return null;
  }

  return {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
  };
}

/**
 * Calculate Euclidean distance between two points.
 */
function getDistance(
  start: TouchPosition,
  end: TouchPosition
): number {
  return Math.hypot(
    end.x - start.x,
    end.y - start.y
  );
}

/**
 * Create a production-grade swipe gesture engine.
 */
export function createSwipeEngine(
  element: HTMLElement,
  config: SwipeConfig = {}
): SwipeEngine {
  if (!element) {
    throw new Error(
      'NexoraOS™ Swipe Engine: A valid HTMLElement is required.'
    );
  }

  const options = normalizeConfig(config);

  let active = true;
  let destroyed = false;
  let startPosition: TouchPosition | null = null;
  let gestureConsumed = false;

  /**
   * Handle touch start.
   */
  const handleTouchStart = (
    event: TouchEvent
  ): void => {
    if (!active || destroyed) {
      return;
    }

    /*
     * Ignore multi-touch gestures.
     */
    if (event.touches.length !== 1) {
      startPosition = null;
      gestureConsumed = false;
      return;
    }

    startPosition = getTouchPosition(event);
    gestureConsumed = false;
  };

  /**
   * Handle touch movement.
   */
  const handleTouchMove = (
    event: TouchEvent
  ): void => {
    if (
      !active ||
      destroyed ||
      !startPosition ||
      gestureConsumed
    ) {
      return;
    }

    const currentPosition = getTouchPosition(event);

    if (!currentPosition) {
      return;
    }

    const deltaX =
      currentPosition.x - startPosition.x;

    const deltaY =
      currentPosition.y - startPosition.y;

    /*
     * Do not classify the gesture until it has
     * crossed the configured movement threshold.
     */
    if (
      Math.abs(deltaX) < options.threshold &&
      Math.abs(deltaY) < options.threshold
    ) {
      config.onSwiping?.(
        deltaX,
        deltaY,
        currentPosition
      );

      return;
    }

    config.onSwiping?.(
      deltaX,
      deltaY,
      currentPosition
    );
  };

  /**
   * Handle touch end.
   */
  const handleTouchEnd = (
    event: TouchEvent
  ): void => {
    if (
      !active ||
      destroyed ||
      !startPosition ||
      gestureConsumed
    ) {
      startPosition = null;
      return;
    }

    const endPosition = getTouchPosition(event);

    if (!endPosition) {
      startPosition = null;
      return;
    }

    const deltaX =
      endPosition.x - startPosition.x;

    const deltaY =
      endPosition.y - startPosition.y;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const duration = Math.max(
      endPosition.time - startPosition.time,
      1
    );

    const distance = getDistance(
      startPosition,
      endPosition
    );

    const velocity = distance / duration;

    /*
     * Ignore gestures that take too long.
     */
    if (duration > options.maxDuration) {
      startPosition = null;
      return;
    }

    /*
     * A valid gesture must travel far enough.
     */
    if (distance < options.threshold) {
      startPosition = null;
      return;
    }

    /*
     * Determine the dominant axis.
     */
    const isHorizontal = absX >= absY;

    let direction: SwipeDirection | null = null;

    if (isHorizontal) {
      const verticalRatio =
        absX === 0
          ? Infinity
          : absY / absX;

      if (
        verticalRatio <=
        options.maxVerticalRatio
      ) {
        direction =
          deltaX < 0
            ? 'left'
            : 'right';
      }
    } else {
      const horizontalRatio =
        absY === 0
          ? Infinity
          : absX / absY;

      if (
        horizontalRatio <=
        options.maxHorizontalRatio
      ) {
        direction =
          deltaY < 0
            ? 'up'
            : 'down';
      }
    }

    /*
     * Reject ambiguous diagonal gestures.
     */
    if (!direction) {
      startPosition = null;
      return;
    }

    /*
     * Reject slow accidental movement.
     */
    if (velocity < options.minVelocity) {
      startPosition = null;
      return;
    }

    const swipeEvent: SwipeEvent = {
      direction,
      deltaX,
      deltaY,
      distance,
      duration,
      velocity,
      start: startPosition,
      end: endPosition,
    };

    gestureConsumed = true;

    /*
     * Optional haptic confirmation.
     */
    if (options.enableHaptic) {
      triggerHaptic(options.hapticType);
    }

    /*
     * Generic callback.
     */
    config.onSwipe?.(swipeEvent);

    /*
     * Direction-specific callback.
     */
    switch (direction) {
      case 'left':
        config.onSwipeLeft?.(swipeEvent);
        break;

      case 'right':
        config.onSwipeRight?.(swipeEvent);
        break;

      case 'up':
        config.onSwipeUp?.(swipeEvent);
        break;

      case 'down':
        config.onSwipeDown?.(swipeEvent);
        break;
    }

    startPosition = null;
  };

  /**
   * Handle touch cancellation.
   */
  const handleTouchCancel = (): void => {
    startPosition = null;
    gestureConsumed = false;
  };

  /**
   * Attach listeners.
   */
  const attachListeners = (): void => {
    element.addEventListener(
      'touchstart',
      handleTouchStart,
      {
        passive: true,
      }
    );

    element.addEventListener(
      'touchmove',
      handleTouchMove,
      {
        passive: true,
      }
    );

    element.addEventListener(
      'touchend',
      handleTouchEnd,
      {
        passive: true,
      }
    );

    element.addEventListener(
      'touchcancel',
      handleTouchCancel,
      {
        passive: true,
      }
    );
  };

  /**
   * Remove listeners.
   */
  const removeListeners = (): void => {
    element.removeEventListener(
      'touchstart',
      handleTouchStart
    );

    element.removeEventListener(
      'touchmove',
      handleTouchMove
    );

    element.removeEventListener(
      'touchend',
      handleTouchEnd
    );

    element.removeEventListener(
      'touchcancel',
      handleTouchCancel
    );
  };

  attachListeners();

  return {
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;
      active = false;

      removeListeners();

      startPosition = null;
      gestureConsumed = false;
    },

    enable(): void {
      if (destroyed) {
        return;
      }

      if (active) {
        return;
      }

      active = true;
      attachListeners();
    },

    disable(): void {
      if (destroyed || !active) {
        return;
      }

      active = false;
      startPosition = null;
      gestureConsumed = false;

      removeListeners();
    },

    get enabled(): boolean {
      return active && !destroyed;
    },
  };
}