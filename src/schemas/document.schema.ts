import { ForbiddenError } from '@/libs/errors.lib';
import { z } from 'zod';

export const documentIdSchema = z.object({
  documentId: z.string().min(1).max(128),
});

export const listDocumentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

export function validateFileBytes(file: Express.Multer.File): void {
  const maxBytes = Number(process.env.DOCUMENT_MAX_BYTES ?? 20 * 1024 * 1024);

  if (file.size < 1 || file.size > maxBytes) {
    throw payloadTooLarge('File size is outside the allowed limit');
  }

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new ForbiddenError('Only PDF, DOCX, and TXT files are supported');
  }

  const ext = file.originalname.toLowerCase().split('.').pop();

  const expected = new Map([
    ['pdf', 'application/pdf'],
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['txt', 'text/plain'],
  ]);

  if (!ext || expected.get(ext) !== file.mimetype) {
    throw new ForbiddenError('File extension does not match its content type');
  }

  if (file.mimetype === 'application/pdf' && file.buffer.subarray(0, 5).toString() !== '%PDF-') {
    throw new ForbiddenError('The uploaded file is not a valid PDF');
  }

  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
    file.buffer.subarray(0, 2).toString() !== 'PK'
  ) {
    throw new ForbiddenError('The uploaded file is not a valid DOCX archive');
  }

  if (file.mimetype === 'text/plain' && file.buffer.includes(0)) {
    throw new ForbiddenError('Binary content is not accepted as a text file');
  }
}
export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required'),
});

export const documentParamsSchema = z.object({
  id: z.string().uuid('Invalid document ID'),
});

export const listDocumentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'ready', 'failed']).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'title', 'chunkCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const documentJobSchema = z.object({
  version: z.literal(1).optional(),
  documentId: z.string().uuid(),
  ownerId: z.string().uuid(),
  correlationId: z.string().min(1).max(128),
});

export type DocumentJob = z.infer<typeof documentJobSchema>;
