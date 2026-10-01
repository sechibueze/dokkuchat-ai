import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import * as Validator from '../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
const router = Router();

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
