import { Request, Response } from 'express';
import * as usersService from './users.service';

export const me = async (req: Request, res: Response) => {
  const user = await usersService.getById(req.user!.id);
  res.json({ status: 'success', data: user });
};

export const list = async (_req: Request, res: Response) => {
  const users = await usersService.list();
  res.json({ status: 'success', data: users });
};
