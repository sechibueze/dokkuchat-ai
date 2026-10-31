import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStorageProvider, StoredObject } from './document-storage.provider';

export class LocalDocumentStorage implements DocumentStorageProvider {
  constructor(private readonly root: string) {}

  private resolveKey(key: string): string {
    if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes('..')) {
      throw new Error('Invalid storage key');
    }

    const resolvedRoot = path.resolve(path.resolve(process.cwd(), this.root ?? 'storage'));
    const resolvedPath = path.resolve(resolvedRoot, key);

    if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
      throw new Error('Invalid storage path');
    }

    return resolvedPath;
  }

  async put(input: { key: string; buffer: Buffer; contentType: string }): Promise<StoredObject> {
    const key = input.key || randomUUID();
    const filePath = this.resolveKey(key);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.buffer, { flag: 'wx' });

    return {
      key,
      sizeBytes: input.buffer.byteLength,
      contentType: input.contentType,
    };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolveKey(key));
  }
}
