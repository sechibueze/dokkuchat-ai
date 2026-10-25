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
interface ListDocumentsOptions {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'chunkCount';
  sortOrder?: 'asc' | 'desc';
}

export async function listDocuments(
  userId: string,
  options: ListDocumentsOptions,
) {
  const {
    page,
    limit,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Build the where clause dynamically
  const where: any = {
    userId,
    deletedAt: null, // Soft delete filter (we'll add this today)
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        filename: true,
        status: true,
        chunkCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    data: documents,
    meta: { page, limit, total },
  };
}
