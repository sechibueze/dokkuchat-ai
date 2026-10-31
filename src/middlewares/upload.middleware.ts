import multer from 'multer';

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 20 * 1024 * 1024,
    fields: 10,
    parts: 12,
  },
});
