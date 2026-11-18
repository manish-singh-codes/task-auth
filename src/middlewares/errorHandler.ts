import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }

  // malformed JSON body etc.
  if ((err as { type?: string })?.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }

  console.error('[unhandled]', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
};
