import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import * as Validator from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MyPassword123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post(
  '/',
  Validator.validate(createUserSchema),
  UserController.createUser,
);

router.get('/', UserController.getAllUsers);

router.get('/:id', UserController.getUserById);

router.put(
  '/:id',
  Validator.validate(updateUserSchema),
  UserController.updateUser,
);

router.delete('/:id', UserController.deleteUser);

export default router;
