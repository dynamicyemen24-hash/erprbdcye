import * as http from 'http';

interface ShutdownConfig {
  timeout: number;
  onShutdown?: () => Promise<void>;
}

export class GracefulShutdown {
  private isShuttingDown = false;
  private activeResponses = new Set<http.ServerResponse>();
  private shutdownTimer: NodeJS.Timeout | null = null;
  private config: ShutdownConfig;

  constructor(config: Partial<ShutdownConfig> = {}) {
    this.config = { timeout: config.timeout || 30000, onShutdown: config.onShutdown };
  }

  trackResponse(res: http.ServerResponse) {
    this.activeResponses.add(res);
    res.on('finish', () => this.activeResponses.delete(res));
  }

  async shutdown(signal: string, server: http.Server): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    console.log(`[SHUTDOWN] Received ${signal}, starting graceful shutdown...`);

    this.shutdownTimer = setTimeout(() => {
      console.error(`[SHUTDOWN] Timeout after ${this.config.timeout}ms, forcing exit`);
      process.exit(1);
    }, this.config.timeout);

    server.close(async () => {
      console.log('[SHUTDOWN] HTTP server closed');
      if (this.config.onShutdown) {
        try { await this.config.onShutdown(); } catch (e: any) { console.error('[SHUTDOWN] Cleanup error:', e.message); }
      }
      if (this.shutdownTimer) clearTimeout(this.shutdownTimer);
      console.log('[SHUTDOWN] Graceful shutdown complete');
      process.exit(0);
    });

    if (this.activeResponses.size > 0) {
      console.log(`[SHUTDOWN] Waiting for ${this.activeResponses.size} active response(s)...`);
    }
  }

  getIsShuttingDown() { return this.isShuttingDown; }
}

export function setupGracefulShutdown(server: http.Server, cleanup?: () => Promise<void>) {
  const shutdown = new GracefulShutdown({ timeout: 30000, onShutdown: cleanup });
  
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => shutdown.shutdown(signal, server));
  });

  process.on('uncaughtException', (error) => {
    console.error('[SHUTDOWN] Uncaught exception:', error);
    shutdown.shutdown('uncaughtException', server);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[SHUTDOWN] Unhandled rejection:', reason);
  });

  return shutdown;
}
