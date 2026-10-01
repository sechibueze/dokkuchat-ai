import { Router } from 'express';

import healthRoutes from './health.route';
import usersRoutes from './users.route';
import authRoutes from './auth.route';
const router = Router();

router.use('/health', healthRoutes);
router.use('/users', usersRoutes);
router.use('/auth', authRoutes);

export { router as routes };
