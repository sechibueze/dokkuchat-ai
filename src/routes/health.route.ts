import { Router } from 'express';

const router = Router();

router.get('/', async (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health check successful',
  });
});

export default router;
