import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { DocumentStorageProvider, StoredObject } from './document-storage.provider';
import { env } from '@/config/env';

export class S3DocumentStorage implements DocumentStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = env.AWS_REGION;
    const bucket = env.AWS_S3_BUCKET;

    if (!region || !bucket) {
      throw new Error('AWS_REGION and AWS_S3_BUCKET are required for S3 storage');
    }

    this.client = new S3Client({
      region,
      endpoint: env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = bucket;
  }

  async put(input: { key: string; buffer: Buffer; contentType: string }): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.contentType,
      }),
    );

    return {
      key: input.key,
      sizeBytes: input.buffer.byteLength,
      contentType: input.contentType,
    };
  }

  async get(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`Object body is empty for key: ${key}`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async getDocumentUrl(key: string, expiresInSeconds = 3600) {
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      {
        expiresIn: expiresInSeconds,
      },
    );
  }
}
