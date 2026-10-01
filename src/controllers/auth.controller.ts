import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';
import { logger } from '../config/logger';
import app from '../app';
import { appEvents } from '../libs/event.lib';
import { AUTH_EVENTS } from '../events/auth.event';
import type { Request, Response, NextFunction } from 'express';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const data = await AuthService.loginUser({ email, password });
    // Implement login logic here
    return res.json({ status: true, message: 'Login successful', data });
  } catch (error) {
    logger.error(`Error during login: ${error}`);
    appEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
      email: req.body.email,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
};

export const getLoggedInUser = async (req: Request, res: Response) => {
  // Implement logic to get logged-in user details here
  const authUserId = req.user?.sub; // Assuming you have user info in req.user
  logger.info(`Fetching details for logged-in user with ID: ${authUserId}`);

  const data = await UserService.getUserById(authUserId);
  return res.status(200).json({
    status: true,
    message: 'User details fetched',
    data,
  });
};

export const getRefreshTokens = async (req: Request, res: Response) => {
  // Implement refresh token logic here
  const { refresh_token: refreshToken } = req.body;
  const data = await AuthService.generateRefreshToken(refreshToken);
  return res.json({ status: true, message: 'Refresh token generated', data });
};
