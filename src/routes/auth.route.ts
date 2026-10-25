import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as Validator from '../middlewares/validate.middleware';
import { loginSchema } from '@/schemas/auth.schema';
import { authenticate } from '@/middlewares/auth.middleware';
const router = Router();

router.post('/', Validator.validate(loginSchema), AuthController.login);

router.get('/me', authenticate, AuthController.getLoggedInUser);

router.post('/refresh-tokens', AuthController.getRefreshTokens);

export default router;
