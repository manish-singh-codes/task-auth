import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required'));
  }

  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
