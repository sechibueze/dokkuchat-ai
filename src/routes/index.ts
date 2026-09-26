import { Router } from 'express';

import healthRoutes from './health.route';
import usersRoutes from './users.route';
const router = Router();

router.use('/health', healthRoutes);
router.use('/users', usersRoutes);

export { router as routes };
