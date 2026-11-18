import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export const validateBody =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    // a ZodError thrown here is turned into a 400 by the error handler
    req.body = schema.parse(req.body);
    next();
  };
