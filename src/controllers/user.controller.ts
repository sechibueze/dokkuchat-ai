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
      status: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updatedUser = await userService.updateUser(
      req.params.id as string,
      req.body,
    );

    return res.status(200).json({
      status: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await userService.deleteUser(req.params.id as string);

    return res.status(200).json({
      status: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.getUserById(req.params.id as string);

    return res.status(200).json({
      status: true,
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      status: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
