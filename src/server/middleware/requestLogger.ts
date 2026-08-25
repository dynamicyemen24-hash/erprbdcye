import { Request, Response, NextFunction } from 'express';
import logger from '../core/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      requestId: req.id,
      contentLength: res.get('content-length'),
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', { meta: logData });
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', { meta: logData });
    } else if (duration > 1000) {
      logger.warn('Slow request', { meta: logData });
    } else {
      logger.info('Request completed', { meta: logData });
    }
  });

  next();
}
