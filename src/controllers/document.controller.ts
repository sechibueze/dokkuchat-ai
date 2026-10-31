import { ForbiddenError } from '@/libs/errors.lib';
import { createDocumentStorage } from '@/modules/documents/storage/storage.factory';
import { documentService } from '@/services/document.service';
import type { Request, Response } from 'express';

const SORT_FIELDS = ['createdAt', 'title', 'chunkCount'] as const;
const STATUSES = ['UPLOADED', 'QUEUED', 'PROCESSING', 'READY', 'FAILED'] as const;
const storage = createDocumentStorage();
const pick = <T extends readonly string[]>(list: T, v: unknown): T[number] | undefined =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? v : undefined;

export const documentController = {
  async upload(req: Request, res: Response) {
    if (!req.file) {
      throw new ForbiddenError("No file uploaded (expected form field 'file')");
    }

    const { document, duplicate } = await documentService.uploadDocument(
      {
        ownerId: req.user!.sub,
        title: typeof req.body.title === 'string' ? req.body.title : undefined,
        file: req.file,
      },
      { correlationId: req?.correlationId },
    );

    return res.status(duplicate ? 200 : 201).json({
      status: true,
      message: duplicate ? 'Document already uploaded' : 'Document uploaded',
      data: {
        ...document,
        sizeBytes: document.sizeBytes.toString(),
      },
    });
  },

  async list(req: Request, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await documentService.listDocuments(req.user!.sub, {
      page,
      limit,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
    });

    res.json({ status: true, ...result });
  },

  async get(req: Request, res: Response) {
    const doc = await documentService.getDocument(req.params.id as string, req.user!.sub);
    res.json({
      status: true,
      data: {
        ...doc,
        sizeBytes: doc.sizeBytes.toString(),
      },
    });
  },

  async remove(req: Request, res: Response) {
    await documentService.deleteDocument(req.params.id as string, req.user!.sub);
    res.status(204).send();
  },
};
