import { env } from '@/config/env';
import type { DocumentStorageProvider } from '@/modules/documents/storage/document-storage.provider';
import { LocalDocumentStorage } from '@/modules/documents/storage/local-storage.provider';
import { S3DocumentStorage } from '@/modules/documents/storage/s3-storage.provider';

export function createDocumentStorage(): DocumentStorageProvider {
  const provider = env.DOCUMENT_STORAGE_PROVIDER ?? 'local';

  switch (provider) {
    case 'local':
      return new LocalDocumentStorage(env.LOCAL_STORAGE_ROOT ?? 'storage');

    case 's3':
      return new S3DocumentStorage();

    default:
      throw new Error(`Unsupported DOCUMENT_STORAGE_PROVIDER: ${provider}`);
  }
}
