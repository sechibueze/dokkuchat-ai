import type { Prisma, DocumentStatus } from '@prisma/client';
import { db } from '@/config/database';

export type DocumentSortBy = 'createdAt' | 'title' | 'chunkCount';

export interface FindManyParams {
  ownerId: string;
  status?: DocumentStatus;
  search?: string;
  sortBy: DocumentSortBy;
  sortOrder: 'asc' | 'desc';
  skip: number;
  take: number;
}

const listSelect = {
  id: true,
  title: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  status: true,
  chunkCount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DocumentSelect;

export const documentRepository = {
  findById(id: string) {
    return db.document.findFirst({ where: { id, deletedAt: null } });
  },

  findByChecksum(ownerId: string, checksum: string) {
    return db.document.findFirst({
      where: { ownerId, checksum, deletedAt: null },
    });
  },

  async findMany(params: FindManyParams) {
    const { ownerId, status, search, sortBy, sortOrder, skip, take } = params;

    const where = {
      ownerId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        // OR, not AND: match either field
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await db.$transaction([
      db.document.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
        select: listSelect,
      }),
      db.document.count({ where }),
    ]);

    return { items, total };
  },

  create(data: Prisma.DocumentUncheckedCreateInput) {
    return db.document.create({ data });
  },

  updateStatus(id: string, status: DocumentStatus, errorCode?: string | null) {
    return db.document.update({
      where: { id },
      data: { status, errorCode: errorCode ?? null },
    });
  },

  softDelete(id: string, deletedBy: string) {
    return db.document.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy, status: 'DELETED' },
    });
  },
};
