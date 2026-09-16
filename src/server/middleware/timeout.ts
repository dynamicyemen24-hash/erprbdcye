import { Request, Response, NextFunction } from 'express';

export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      // Mark the request so long-running handlers can bail out early
      // instead of doing wasted work (and double-sending the response).
      (req as any).timedout = true;
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    if (typeof (timeout as any).unref === 'function') (timeout as any).unref();
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
}
