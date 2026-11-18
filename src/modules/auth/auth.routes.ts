import { Router } from 'express';
import { loginRateLimiter } from '../../middlewares/loginRateLimiter';
import { validateBody } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  asyncHandler(controller.login),
);

export default router;
