/**
 * NexoraOS™ — Smart API Response Compression
 * Context-aware compression with Brotli/Gzip/Deflate negotiation
 */

import { Request, Response, NextFunction } from 'express';
import { createGzip, createDeflate, createBrotliCompress } from 'zlib';

interface CompressionOptions {
  /** Minimum byte size before compressing (default: 1024) */
  threshold?: number;
  /** Compression level 0-9 (default: 6) */
  level?: number;
  /** Enable Brotli negotiation (default: true) */
  brotli?: boolean;
}

export function smartCompression(options: CompressionOptions = {}) {
  const { threshold = 1024, level = 6, brotli = true } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Determine best encoding
    let encoding: string | null = null;
    if (brotli && acceptEncoding.includes('br')) {
      encoding = 'br';
    } else if (acceptEncoding.includes('gzip')) {
      encoding = 'gzip';
    } else if (acceptEncoding.includes('deflate')) {
      encoding = 'deflate';
    }

    if (!encoding) {
      return next();
    }

    // Override json method to compress large responses
    res.json = (body: any) => {
      const jsonStr = JSON.stringify(body);

      if (jsonStr.length < threshold) {
        return originalJson(body);
      }

      const buffer = Buffer.from(jsonStr);

      res.setHeader('Content-Encoding', encoding!);
      res.setHeader('Vary', 'Accept-Encoding');

      let compressor;
      switch (encoding) {
        case 'br':
          compressor = createBrotliCompress();
          break;
        case 'gzip':
          compressor = createGzip({ level });
          break;
        case 'deflate':
          compressor = createDeflate({ level });
          break;
      }

      compressor!.end(buffer);

      const chunks: Buffer[] = [];
      compressor!.on('data', (chunk: Buffer) => chunks.push(chunk));
      compressor!.on('end', () => {
        const compressed = Buffer.concat(chunks);
        res.setHeader('Content-Length', compressed.length);
        originalSend(compressed);
      });

      return res;
    };

    // Override send to compress string payloads above threshold
    const originalSendBound = originalSend;
    res.send = (body: any) => {
      if (typeof body === 'string' && body.length >= threshold) {
        const buffer = Buffer.from(body);

        res.setHeader('Content-Encoding', encoding!);
        res.setHeader('Vary', 'Accept-Encoding');

        let compressor;
        switch (encoding) {
          case 'br':
            compressor = createBrotliCompress();
            break;
          case 'gzip':
            compressor = createGzip({ level });
            break;
          case 'deflate':
            compressor = createDeflate({ level });
            break;
        }

        compressor!.end(buffer);

        const chunks: Buffer[] = [];
        compressor!.on('data', (chunk: Buffer) => chunks.push(chunk));
        compressor!.on('end', () => {
          const compressed = Buffer.concat(chunks);
          res.setHeader('Content-Length', compressed.length);
          originalSendBound(compressed);
        });

        return res;
      }
      return originalSendBound(body);
    };

    next();
  };
}
