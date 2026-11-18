import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { signToken } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

// used to keep response time similar when the email doesn't exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.BCRYPT_ROUNDS);

const toPublicUser = (u: { id: string; email: string; name: string; createdAt: Date }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  createdAt: u.createdAt,
});

export async function register({ name, email, password }: RegisterInput) {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    return { user: toPublicUser(user), token: signToken({ sub: user.id, email: user.email }) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Email is already registered');
    }
    throw err;
  }
}

export async function login({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  return { user: toPublicUser(user), token: signToken({ sub: user.id, email: user.email }) };
}
