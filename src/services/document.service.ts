import path from 'node:path';
import { db } from '../config/database';
import { ForbiddenError, NotFoundError } from '../libs/errors.lib';
import { getUserPermissions } from './rbac.service';
import { documentRepository } from '@/repositories/document.repository';
import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { validateFileBytes } from '@/schemas/document.schema';
import { createDocumentStorage } from '@/modules/documents/storage/storage.factory';
import { env } from '@/config/env';
import { enqueueDocumentIngestion } from '@/queues/document.queue';

const storage = createDocumentStorage();

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);
export interface ListDocumentsOptions {
  page: number;
  limit: number;
  // status?: DocumentStatus;
  // sortBy?: DocumentSortBy;
  search?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UploadDocumentInput {
  ownerId: string;
  title?: string;
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer };
}

export const documentService = {
  async uploadDocument(
    input: { file: Express.Multer.File; ownerId: string },
    option: { correlationId: string } = {},
  ) {
    const { ownerId, file } = input;
    validateFileBytes(input.file);

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new ForbiddenError(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size === 0) {
      throw new ForbiddenError('File is empty');
    }

    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const existingDocument = await documentRepository.findByChecksum(ownerId, checksum);
    if (existingDocument) {
      // Idempotent: same file uploaded twice returns the original record
      return { document: existingDocument, duplicate: true };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const storageKey = `${env.NODE_ENV}/documents/${ownerId}/${crypto.randomUUID()}${ext}`;

    const output = await storage.put({
      key: storageKey,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    try {
      const doc = await documentRepository.create({
        ownerId,
        title: path.basename(file.originalname, ext).slice(0, 255),
        originalName: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        checksum,
        storageKey: output.key,
        status: 'UPLOADED',
      });

      // TODO: enqueue ingestion job (parse -> chunk -> embed), then
      // documentRepository.updateStatus(doc.id, 'QUEUED')
      await enqueueDocumentIngestion({
        documentId: doc.id,
        ownerId: doc.ownerId,
        correlationId: option.correlationId as string,
      });
      return { document: doc, duplicate: false };
    } catch (err) {
      await storage.delete(storageKey).catch(() => undefined);
      throw err;
    }
  },
  async getDocument(id: string, userId: string) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document not found');

    return doc;
  },

  async listDocuments(userId: string, options: ListDocumentsOptions) {
    const { page, limit, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const { items, total } = await documentRepository.findMany({
      ownerId: userId,
      search,
      sortBy,
      sortOrder,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async deleteDocument(id: string, userId: string) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new NotFoundError('Document not found');
    await documentRepository.softDelete(id, userId);
  },
};
// export const getDocument = async (req: Request, res: Response) => {
//   const doc = await db.document.findUnique({
//     where: { id: req.params.id as string },
//   });

//   if (!doc) {
//     throw new NotFoundError('Document not found');
//   }

//   // Resource ownership check
//   if (doc.userId !== req.user!.sub) {
//     // Admins can see everything
//     const permissions = await getUserPermissions(req.user!.sub);
//     if (!permissions.has('users:manage')) {
//       throw new NotFoundError('Document not found');
//     }
//   }

//   res.json({ status: true, data: doc });
// };
// interface ListDocumentsOptions {
//   page: number;
//   limit: number;
//   status?: string;
//   search?: string;
//   sortBy?: 'createdAt' | 'title' | 'chunkCount';
//   sortOrder?: 'asc' | 'desc';
// }

// export async function listDocuments(userId: string, options: ListDocumentsOptions) {
//   const { page, limit, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;

//   // Build the where clause dynamically
//   const where: any = {
//     userId,
//     deletedAt: null, // Soft delete filter (we'll add this today)
//   };

//   if (status) {
//     where.status = status;
//   }

//   if (search) {
//     where.title = { contains: search, mode: 'insensitive' };
//     where.description = { contains: search, mode: 'insensitive' };
//   }

//   const [documents, total] = await Promise.all([
//     prisma.document.findMany({
//       where,
//       orderBy: { [sortBy]: sortOrder },
//       skip: (page - 1) * limit,
//       take: limit,
//       select: {
//         id: true,
//         title: true,
//         filename: true,
//         status: true,
//         chunkCount: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     }),
//     prisma.document.count({ where }),
//   ]);

//   return {
//     data: documents,
//     meta: { page, limit, total },
//   };
// }
