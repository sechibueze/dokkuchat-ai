import { db } from '../config/database';
import { NotFoundError } from '../libs/errors.lib';
import { getUserPermissions } from './rbac.service';
import type { Request, Response } from 'express';

export const getDocument = async (req: Request, res: Response) => {
  const doc = await db.document.findUnique({
    where: { id: req.params.id as string },
  });

  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  // Resource ownership check
  if (doc.userId !== req.user!.sub) {
    // Admins can see everything
    const permissions = await getUserPermissions(req.user!.sub);
    if (!permissions.has('users:manage')) {
      throw new NotFoundError('Document not found');
    }
  }

  res.json({ status: true, data: doc });
};
