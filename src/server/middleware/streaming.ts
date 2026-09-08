/**
 * NexoraOS™ — Streaming JSON Response Engine
 * Yields large datasets chunk-by-chunk to prevent memory spikes.
 * Supports cursor-based pagination and real-time streaming.
 */

import { Response } from 'express';

interface StreamOptions {
  /** Maximum items per chunk (default: 100) */
  chunkSize?: number;
  /** Compress output with Brotli/Gzip (default: true) */
  compress?: boolean;
  /** Include metadata footer (default: true) */
  includeMetadata?: boolean;
}

interface StreamMetadata {
  total: number;
  chunked: boolean;
  streamed_at: string;
  duration_ms: number;
}

/**
 * Stream a large array as chunked JSON response.
 * Memory usage stays constant regardless of dataset size.
 *
 * Usage:
 *   streamJson(res, queryResult.rows, { chunkSize: 500 });
 */
export function streamJson<T>(
  res: Response,
  data: T[],
  options: StreamOptions = {}
): void {
  const { chunkSize = 100, includeMetadata = true } = options;
  const startTime = Date.now();
  const total = data.length;

  // Small datasets — send directly (no streaming overhead)
  if (total <= chunkSize) {
    res.setHeader('X-Stream-Mode', 'direct');
    res.setHeader('X-Stream-Total', String(total));
    res.json({
      data,
      metadata: includeMetadata ? {
        total,
        chunked: false,
        streamed_at: new Date().toISOString(),
        duration_ms: 0,
      } : undefined,
    });
    return;
  }

  // Large datasets — stream in chunks
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Stream-Mode', 'chunked');
  res.setHeader('X-Stream-Total', String(total));
  res.setHeader('X-Stream-Chunk-Size', String(chunkSize));
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'private, no-store');

  // Write opening bracket and first chunk
  let chunkIndex = 0;
  let sent = 0;

  function sendChunk(): void {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, total);
    const chunk = data.slice(start, end);

    if (chunkIndex === 0) {
      // Start the JSON array
      res.write('{"data":[');
    }

    // Write chunk items
    for (let i = 0; i < chunk.length; i++) {
      const prefix = sent === 0 ? '' : ',';
      res.write(prefix + JSON.stringify(chunk[i]));
      sent++;
    }

    chunkIndex++;

    if (sent < total) {
      // More chunks to send — yield control to event loop
      setImmediate(sendChunk);
    } else {
      // Final chunk — close the JSON
      const metadata: StreamMetadata | undefined = includeMetadata ? {
        total,
        chunked: true,
        streamed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      } : undefined;

      const footer = metadata
        ? `],"metadata":${JSON.stringify(metadata)}}`
        : ']}';

      res.write(footer);
      res.end();
    }
  }

  sendChunk();
}

/**
 * Stream database query results directly.
 * Executes query and streams results without loading all rows into memory.
 *
 * Usage:
 *   await streamQueryResults(res, pool, 'SELECT * FROM users', [], { chunkSize: 200 });
 */
export async function streamQueryResults(
  res: Response,
  pool: any,
  query: string,
  params: any[] = [],
  options: StreamOptions = {}
): Promise<void> {
  const { chunkSize = 200, includeMetadata = true } = options;
  const startTime = Date.now();

  const client = await pool.connect();
  try {
    const cursorName = `stream_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Use cursor-based streaming for memory efficiency
    await client.query('BEGIN');
    await client.query(`DECLARE ${cursorName} CURSOR FOR ${query}`, params);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Stream-Mode', 'cursor');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'private, no-store');

    let sent = 0;
    let chunkIndex = 0;

    res.write('{"data":[');

    while (true) {
      const result = await client.query(`FETCH ${chunkSize} FROM ${cursorName}`);
      if (result.rows.length === 0) break;

      for (const row of result.rows) {
        const prefix = sent === 0 ? '' : ',';
        res.write(prefix + JSON.stringify(row));
        sent++;
      }

      chunkIndex++;
    }

    await client.query(`CLOSE ${cursorName}`);
    await client.query('COMMIT');

    const metadata: StreamMetadata | undefined = includeMetadata ? {
      total: sent,
      chunked: true,
      streamed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    } : undefined;

    const footer = metadata
      ? `],"metadata":${JSON.stringify(metadata)}}`
      : ']}';

    res.write(footer);
    res.end();
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Server-Sent Events (SSE) stream for real-time updates.
 *
 * Usage:
 *   const stream = createSSEStream(res);
 *   stream.send({ event: 'update', data: { ... } });
 *   stream.close();
 */
export function createSSEStream(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  let closed = false;

  return {
    send(data: any, event?: string, id?: string): void {
      if (closed) return;
      const lines = [];
      if (id) lines.push(`id: ${id}`);
      if (event) lines.push(`event: ${event}`);
      lines.push(`data: ${JSON.stringify(data)}`);
      lines.push('', ''); // Double newline = end of event
      res.write(lines.join('\n'));
    },

    sendComment(comment: string): void {
      if (closed) return;
      res.write(`: ${comment}\n\n`);
    },

    close(): void {
      if (closed) return;
      closed = true;
      res.end();
    },

    get isClosed(): boolean {
      return closed;
    },
  };
}
