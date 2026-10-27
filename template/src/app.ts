import express, { type ErrorRequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import type { Config } from './config.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function createApp(config: Config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use((req, res, next) => {
    const id = randomUUID();
    res.setHeader('x-request-id', id);
    (req as any).id = id;
    const start = Date.now();
    res.on('finish', () => {
      if (config.env !== 'test') console.log(JSON.stringify({ id, method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - start }));
    });
    next();
  });

  // Liveness: process is up. Add a DB ping here if you want a readiness check.
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.get('/', (_req, res) => res.json({ name: '{{name}}', status: 'running' }));

  app.use((req, _res, next) => next(new HttpError(404, `Route ${req.method} ${req.path} not found`)));

  const onError: ErrorRequestHandler = (err, req, res, _next) => {
    const status = err instanceof HttpError ? err.status : typeof err?.status === 'number' && err.status < 500 ? err.status : 500;
    if (status >= 500) console.error(JSON.stringify({ id: (req as any).id, error: String(err?.stack ?? err) }));
    res.status(status).json({ error: { message: status >= 500 ? 'Internal server error' : err.message, requestId: (req as any).id } });
  };
  app.use(onError);
  return app;
}
