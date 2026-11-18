import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';

const publicFields = { id: true, email: true, name: true, createdAt: true } as const;

export async function getById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicFields });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export const list = () =>
  prisma.user.findMany({ select: publicFields, orderBy: { createdAt: 'desc' }, take: 50 });
