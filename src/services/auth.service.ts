import * as userRepository from '../repositories/user.repository';
import type { LoginUserInput } from '../schemas/auth.schema';
import { verifyPassword } from '../utils/password.util';
import { signToken } from '../utils/jwt.util';

export const loginUser = async ({ email, password }: LoginUserInput) => {
  // Find user by email
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password');
    (error as any).statusCode = 401;
    throw error;
  }

  // Verify password
  const isPasswordValid = await verifyPassword(user.password_hash, password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    (error as any).statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = signToken({
    id: user.id,
    tier: user.tier,
  });

  // 4. Return sanitized user and access token
  const { password_hash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken: token,
  };
};
