import { db } from '../config/database';
import { logger } from '../config/logger';

export const getAllUsers = async () => {
  try {
    const users = await db.user.findMany();
    return users;
  } catch (error) {
    logger.error(`Error fetching all users: ${error}`);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    logger.error(`Error fetching user by email: ${error}`);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    logger.error(`Error fetching user by ID: ${error}`);
    throw error;
  }
};

export const createUser = async (userData: {
  name: string;
  email: string;
  password_hash: string;
}) => {
  try {
    const newUser = await db.user.create({
      data: userData,
    });
    return newUser;
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  updateData: Partial<{ name: string; email: string; password: string }>,
) => {
  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    });
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    await db.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    logger.error(`Error deleting user: ${error}`);
    throw error;
  }
};
