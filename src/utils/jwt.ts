import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  email: string;
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload;
