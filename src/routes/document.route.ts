import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  conditionalGet,
  setCacheControl,
} from '../middlewares/etag.middleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List user's documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, ready, failed]
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/:id',
  conditionalGet(),
  setCacheControl('public, max-age=60'),
  requirePermission('documents:read'),
  validate(listDocumentsSchema),
  listDocuments,
);
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
