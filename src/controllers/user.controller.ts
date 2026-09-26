import type { NextFunction, Request, Response } from 'express';
import * as userService from '../services/user.service';
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const newUser = await userService.createUser(req.body);

    return res.status(201).json({
      status: 'success',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};
