import type { Request, Response } from 'express';

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  return res
    .status(201)
    .json({
      message: 'User created successfully',
      user: { name, email, password },
    });
};
