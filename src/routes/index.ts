import { Router } from 'express';

import healthRoutes from './health.route';
import usersRoutes from './users.route';
import authRoutes from './auth.route';
import adminRoutes from './admin';

import * as RateLimiter from '../middlewares/rate-limiter.middleware';
const router = Router();

router.use('/health', healthRoutes);
router.use('/users', usersRoutes);
router.use('/auth', RateLimiter.authLimiter, authRoutes);
router.use('/admin', adminRoutes);

export { router as routes };
