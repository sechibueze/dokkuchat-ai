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

export const findUserWithPasswordByEmail = async (email: string) => {
  return await db.user.findUnique({
    where: { email },
    // Select password alongside other required auth fields
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  });
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

export const insertUser = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    const newUser = await db.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      },
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

export const storeRefreshToken = async (
  userId: string,
  refreshTokenHash: string,
) => {
  try {
    await db.accessToken.create({
      data: {
        userId,
        token: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });
  } catch (error) {
    logger.error(`Error storing refresh token: ${error}`);
    throw error;
  }
};

export const getRefreshTokenByHash = async (refreshTokenHash: string) => {
  try {
    const tokenRecord = await db.accessToken.findUnique({
      where: { token: refreshTokenHash },
    });
    return tokenRecord;
  } catch (error) {
    logger.error(`Error fetching refresh token: ${error}`);
    throw error;
  }
};

export const deleteRefreshToken = async (refreshTokenHash: string) => {
  try {
    await db.accessToken.delete({
      where: { token: refreshTokenHash },
    });
  } catch (error) {
    logger.error(`Error deleting refresh token: ${error}`);
    throw error;
  }
};

export const createUserRole = async (userId: string, roleId: string) => {
  try {
    const userRole = await db.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    return userRole;
  } catch (error) {
    logger.error(`Error creating user role: ${error}`);
    throw error;
  }
};

export const getDefaultRole = async () => {
  try {
    const defaultRole = await db.role.findFirst({
      where: { isDefault: true },
    });
    return defaultRole;
  } catch (error) {
    logger.error(`Error fetching default role: ${error}`);
    throw error;
  }
};
