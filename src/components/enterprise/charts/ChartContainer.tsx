import React, {
  Component,
  ErrorInfo,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ResponsiveContainer } from 'recharts';
import { AlertCircle, RefreshCw } from 'lucide-react';

/* ==========================================================================
 * NexoraOS™ Chart Infrastructure
 *
 * Enterprise-grade chart container for React + Recharts.
 *
 * Design goals:
 * - SSR safe
 * - Strict TypeScript
 * - ResizeObserver based measurement
 * - Hidden-tab / modal resilience
 * - Error Boundary isolation
 * - Loading / Empty / Error / Ready states
 * - Accessible status announcements
 * - Stable resize handling
 * - Custom fallback surfaces
 * - Imperative refresh support
 * - Framework-independent chart children
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export type ChartStatus =
  | 'loading'
  | 'empty'
  | 'error'
  | 'ready';

export interface ChartDimensions {
  readonly width: number;
  readonly height: number;
}

export interface ChartContainerProps {
  children: ReactNode;

  height?: number | string;
  minHeight?: number | string;

  loading?: boolean;
  empty?: boolean;
  error?: Error | null;

  emptyMessage?: string;
  errorMessage?: string;

  ariaLabel?: string;

  className?: string;

  /**
   * Recharts responsive debounce.
   */
  debounce?: number;

  /**
   * Recharts aspect ratio.
   */
  aspect?: number;

  /**
   * Wait for a measurable container before rendering.
   */
  waitForDimensions?: boolean;

  /**
   * Optional loading surface.
   */
  loadingFallback?: ReactNode;

  /**
   * Optional empty surface.
   */
  emptyFallback?: ReactNode;

  /**
   * Optional error surface.
   */
  errorFallback?: ReactNode;

  /**
   * Optional callback when the chart encounters
   * a render exception.
   */
  onRenderError?: (
    error: Error,
    info: ErrorInfo
  ) => void;

  /**
   * Optional retry action for the error surface.
   */
  onRetry?: () => void;

  /**
   * Enable automatic Error Boundary recovery.
   *
   * Default: true
   */
  recoverable?: boolean;

  /**
   * Optional minimum renderable width.
   *
   * Default: 1
   */
  minWidth?: number;

  /**
   * Optional minimum renderable height.
   *
   * Default: 1
   */
  renderMinHeight?: number;
}

interface ChartErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  recoverable: boolean;
  onError?: (
    error: Error,
    info: ErrorInfo
  ) => void;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* --------------------------------------------------------------------------
 * Constants
 * -------------------------------------------------------------------------- */

const DEFAULT_HEIGHT = 300;
const DEFAULT_MIN_WIDTH = 1;
const DEFAULT_MIN_HEIGHT = 1;

/* --------------------------------------------------------------------------
 * Environment
 * -------------------------------------------------------------------------- */

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/* --------------------------------------------------------------------------
 * Measurement Hook
 * -------------------------------------------------------------------------- */

function useElementDimensions(
  ref: RefObject<HTMLElement | null>,
  enabled = true
): ChartDimensions {
  const [dimensions, setDimensions] =
    useState<ChartDimensions>({
      width: 0,
      height: 0,
    });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element = ref.current;

    if (!element) {
      return;
    }

    if (
      typeof ResizeObserver === 'undefined'
    ) {
      const rect =
        element.getBoundingClientRect();

      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });

      return;
    }

    let frameId: number | null = null;

    const commit = (
      width: number,
      height: number
    ) => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        setDimensions((previous) => {
          if (
            previous.width === width &&
            previous.height === height
          ) {
            return previous;
          }

          return {
            width,
            height,
          };
        });
      });
    };

    const observer = new ResizeObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        const {
          width,
          height,
        } = entry.contentRect;

        commit(
          Math.round(width),
          Math.round(height)
        );
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [enabled, ref]);

  return dimensions;
}

/* --------------------------------------------------------------------------
 * Error Boundary
 * -------------------------------------------------------------------------- */

class ChartErrorBoundary extends React.Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  declare props: ChartErrorBoundaryProps;

  constructor(props: ChartErrorBoundaryProps) {
    super(props);
  }

  public state: ChartErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(
    error: Error
  ): ChartErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo
  ): void {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(
    previousProps: ChartErrorBoundaryProps
  ): void {
    if (
      previousProps.children !==
      this.props.children &&
      this.state.hasError
    ) {
      (this as React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState>).setState({
        hasError: false,
        error: null,
      });
    }
  }

  private handleRetry = (): void => {
    if (!this.props.recoverable) {
      return;
    }

    (this as React.Component<ChartErrorBoundaryProps, ChartErrorBoundaryState>).setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="absolute inset-0"
        role="alert"
        aria-live="assertive"
      >
        {this.props.fallback}

        {this.props.recoverable && (
          <button
            type="button"
            onClick={this.handleRetry}
            className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <RefreshCw
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />

            Try again
          </button>
        )}
      </div>
    );
  }
}

/* --------------------------------------------------------------------------
 * Default States
 * -------------------------------------------------------------------------- */

function DefaultLoadingState(): ReactNode {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading chart"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50"
        aria-hidden="true"
      />
    </div>
  );
}

function DefaultEmptyState({
  message,
}: {
  message: string;
}): ReactNode {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-6 text-center"
      role="status"
      aria-label="No chart data"
    >
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function DefaultErrorState({
  message,
  error,
}: {
  message: string;
  error?: Error | null;
}): ReactNode {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle
        className="h-5 w-5 text-destructive"
        aria-hidden="true"
      />

      <p className="text-sm font-medium text-destructive">
        {message}
      </p>

      {error?.message && (
        <p className="max-w-lg text-xs text-muted-foreground">
          {error.message}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Main Component
 * -------------------------------------------------------------------------- */

function ChartContainerInner({
  children,

  height = DEFAULT_HEIGHT,
  minHeight,

  loading = false,
  empty = false,
  error = null,

  emptyMessage = 'No chart data available.',
  errorMessage = 'Unable to render this chart.',

  ariaLabel = 'Chart',

  className = '',

  debounce = 0,
  aspect,

  waitForDimensions = true,

  loadingFallback,
  emptyFallback,
  errorFallback,

  onRenderError,
  onRetry,

  recoverable = true,

  minWidth = DEFAULT_MIN_WIDTH,
  renderMinHeight = DEFAULT_MIN_HEIGHT,
}: ChartContainerProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const generatedId = useId();

  const chartId =
    `nexora-chart-${generatedId.replace(/:/g, '')}`;

  const dimensions =
    useElementDimensions(
      containerRef,
      waitForDimensions
    );

  /*
   * Determine whether the container is actually
   * renderable by Recharts.
   */
  const measurable = useMemo(() => {
    return (
      dimensions.width >= minWidth &&
      dimensions.height >= renderMinHeight
    );
  }, [
    dimensions.width,
    dimensions.height,
    minWidth,
    renderMinHeight,
  ]);

  /*
   * Explicit state precedence.
   *
   * Error > Loading > Empty > Waiting > Ready
   */
  const status: ChartStatus =
    error
      ? 'error'
      : loading
        ? 'loading'
        : empty
          ? 'empty'
          : waitForDimensions && !measurable
            ? 'loading'
            : 'ready';

  const handleRenderError = useCallback(
    (
      renderError: Error,
      info: ErrorInfo
    ) => {
      onRenderError?.(
        renderError,
        info
      );
    },
    [onRenderError]
  );

  /*
   * Default fallback for Error Boundary.
   */
  const boundaryFallback =
    errorFallback ??
    DefaultErrorState({
      message: errorMessage,
      error,
    });

  return (
    <section
      id={chartId}
      ref={containerRef}
      className={[
        'relative w-full overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        height,
        minHeight,
      }}
      aria-label={ariaLabel}
    >
      {status === 'error' && (
        <div className="absolute inset-0">
          {boundaryFallback}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <RefreshCw
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />

              Retry
            </button>
          )}
        </div>
      )}

      {status === 'loading' && (
        <div className="absolute inset-0">
          {loadingFallback ??
            <DefaultLoadingState />}
        </div>
      )}

      {status === 'empty' && (
        <div className="absolute inset-0">
          {emptyFallback ??
            <DefaultEmptyState
              message={emptyMessage}
            />}
        </div>
      )}

      {status === 'ready' && (
        <ChartErrorBoundary
          recoverable={recoverable}
          fallback={boundaryFallback}
          onError={handleRenderError}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={minWidth}
            minHeight={renderMinHeight}
            debounce={debounce}
            aspect={aspect}
          >
            {children}
          </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </section>
  );
}

export const ChartContainer = React.memo(ChartContainerInner);