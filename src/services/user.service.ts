import type { CreateUserInput } from '../schemas/user.schema.js';
import * as userRepository from '../repositories/user.repository';
import { logger } from '../config/logger.js';
import { hashPassword } from '../utils/password.utl.js';

export const createUser = async (userData: CreateUserInput) => {
  //  Check if user already exists
  const existingUser = await userRepository.getUserByEmail(userData.email);
  if (existingUser) {
    const error = new Error('Email is already registered');
    (error as any).statusCode = 409; // Conflict
    throw error;
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Delegate DB write to Repository
  const newUser = await userRepository.insertUser({
    ...userData,
    password: hashedPassword,
  });

  logger.info(`User created successfully with ID: ${newUser.id}`);

  return newUser;
};
