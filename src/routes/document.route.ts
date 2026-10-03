import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

// Anyone with documents:read can list documents
router.get(
  '/',
  requirePermission('documents:read'),
  validate(listDocumentsSchema),
  listDocuments,
);

// Only documents:create can upload
router.post(
  '/',
  requirePermission('documents:create'),
  validate(createDocumentSchema),
  createDocument,
);

// Only documents:delete can delete (admin only)
router.delete(
  '/:id',
  requirePermission('admin:documents:delete', 'documents:delete'),
  validate(documentParamsSchema),
  deleteDocument,
);

export default router;
