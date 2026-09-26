import { Router } from 'express';
import { createUser } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { createUserSchema } from '../schemas/user.schema';
const router = Router();

router.post('/', validate(createUserSchema), createUser);

export default router;
