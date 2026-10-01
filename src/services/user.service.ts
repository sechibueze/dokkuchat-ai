import type { CreateUserInput } from '../schemas/user.schema.js';
import * as userRepository from '../repositories/user.repository';
import { logger } from '../config/logger.js';
import { hashPassword } from '../utils/password.util';
import { appEvents } from '../libs/event.lib';
import { ConflictError, NotFoundError } from '../libs/errors.lib';
import { AUTH_EVENTS } from '../events/auth.event';

export const createUser = async (userData: CreateUserInput) => {
  //  Check if user already exists
  const existingUser = await userRepository.getUserByEmail(userData.email);
  if (existingUser) {
    throw new ConflictError(
      'Email is already registered',
      409,
      'USER_ALREADY_EXISTS',
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Delegate DB write to Repository
  const newUser = await userRepository.insertUser({
    ...userData,
    password: hashedPassword,
  });

  const defaultRole = await userRepository.getDefaultRole();

  if (defaultRole) {
    await userRepository.createUserRole(newUser.id, defaultRole.id);
  }

  appEvents.emit(AUTH_EVENTS.USER_REGISTERED, {
    userId: newUser.id,
    name: newUser.name,
    email: newUser.email,
  });

  logger.info(`User created successfully with ID: ${newUser.id}`);

  return newUser;
};

export const getAllUsers = async () => {
  const users = await userRepository.getAllUsers();
  return users;
};

export const getUserById = async (userId: string) => {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user;
};

export const updateUser = async (
  userId: string,
  updateData: Partial<CreateUserInput>,
) => {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 404, 'USER_NOT_FOUND');
  }

  // If password is being updated, hash it
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  const updatedUser = await userRepository.updateUser(userId, updateData);
  logger.info(`User with ID: ${userId} updated successfully`);
  return updatedUser;
};

export const deleteUser = async (userId: string) => {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 404, 'USER_NOT_FOUND');
  }

  await userRepository.deleteUser(userId);
  logger.info(`User with ID: ${userId} deleted successfully`);
};
