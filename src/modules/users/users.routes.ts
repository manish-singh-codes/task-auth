import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './users.controller';

const router = Router();

// everything below requires a valid JWT
router.use(authenticate);

router.get('/me', asyncHandler(controller.me));
router.get('/', asyncHandler(controller.list));

export default router;
