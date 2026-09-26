import { Router } from 'express';
import { db } from '../config/database.js';

const router = Router();

router.get('/', async (_req, res) => {
  const newUser = await db.user.create({
    data: {
      name: 'Alice',
      email: 'alice@prisma.io',
      password_hash: 'hashedpassword',
    },
  });

  const users = await db.user.findMany();
  res.status(200).json({
    success: true,
    message: 'DocuChat API is running',
    newUser,
    users,
  });
});

export default router;
