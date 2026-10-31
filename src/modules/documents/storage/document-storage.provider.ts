export interface StoredObject {
  key: string;
  sizeBytes: number;
  contentType: string;
}

export interface DocumentStorageProvider {
  put(input: { key: string; buffer: Buffer; contentType: string }): Promise<StoredObject>;

  get(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;
}
