import * as userRepository from '../repositories/user.repository';
import type { LoginUserInput } from '../schemas/auth.schema';
import { verifyPassword } from '../utils/password.util';
import * as jwtLib from '../libs/jwt.lib';
import { UnauthorizedError } from '../libs/errors.lib';
import crypto from 'crypto';
import app from '../app';
import { appEvents } from '../libs/event.lib';
import { AUTH_EVENTS } from '../events/auth.event';

export const loginUser = async ({ email, password }: LoginUserInput) => {
  // Find user by email
  const user = await userRepository.findUserWithPasswordByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(user.password, password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const accessToken = jwtLib.generateAccessToken({
    sub: user.id,
    tier: user.tier,
    type: 'access',
  });
  const refreshToken = jwtLib.generateRefreshToken({
    sub: user.id,
    tier: user.tier,
    type: 'refresh',
  });

  // Store the refresh token hash
  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  await userRepository.storeRefreshToken(user.id, refreshTokenHash);
  const { password: _, ...userWithoutPassword } = user;

  appEvents.emit(AUTH_EVENTS.USER_LOGGED_IN, {
    userId: user.id,
    name: user.name,
    email: user.email,
  });

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export async function generateRefreshToken(rawRefreshToken: string) {
  // Verify the JWT signature and expiration
  let payload;
  try {
    payload = jwtLib.verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid token type');
  }

  // Check if this token exists in the database (not revoked)
  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(rawRefreshToken)
    .digest('hex');

  const stored = await userRepository.getRefreshTokenByHash(refreshTokenHash);

  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired or revoked');
  }

  // Get the user
  const user = await userRepository.getUserById(payload.sub);
  if (!user || !['pending', 'inactive'].includes(user.status)) {
    throw new UnauthorizedError('User not found or inactive');
  }

  // Rotate: delete the old token, create a new one
  await userRepository.deleteRefreshToken(refreshTokenHash);

  const newAccessToken = jwtLib.generateAccessToken({
    sub: user.id,
    tier: user.tier,
    type: 'access',
  });
  const newRefreshToken = jwtLib.generateRefreshToken({
    sub: user.id,
    tier: user.tier,
    type: 'refresh',
  });
  const newHash = crypto
    .createHash('sha256')
    .update(newRefreshToken)
    .digest('hex');

  await userRepository.storeRefreshToken(user.id, newHash);

  appEvents.emit(AUTH_EVENTS.TOKEN_REFRESHED, {
    userId: user.id,
    name: user.name,
    email: user.email,
    refreshToken: newRefreshToken,
  });
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
