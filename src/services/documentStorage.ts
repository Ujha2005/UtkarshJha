// Document Storage Provider Abstraction for CAREGRAPH
// Separates physical binary storage (S3 / GCS / Azure Blob) from database metadata records.
// In demo mode, volatile browser in-memory storage is used.

export interface StoredDocumentMetadata {
  id: string;
  patientId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  storageUri: string;
  uploadedAt: string;
  uploadedBy: string;
  encryptionStatus: 'AES-256-GCM' | 'Client-Encrypted' | 'Demo-Unencrypted';
}

export interface IDocumentStorageProvider {
  readonly providerType: 'in-memory-demo' | 's3-production' | 'gcs-production';

  store(
    patientId: string,
    file: { name: string; size: number; type: string; content: string | Blob },
    uploadedBy?: string
  ): Promise<StoredDocumentMetadata>;

  retrieve(documentId: string): Promise<string | Blob>;

  delete(documentId: string): Promise<void>;

  getMetadata(documentId: string): Promise<StoredDocumentMetadata | null>;
}

export class MockClientDocumentStorageProvider implements IDocumentStorageProvider {
  public readonly providerType = 'in-memory-demo' as const;
  private storage = new Map<string, { metadata: StoredDocumentMetadata; content: string | Blob }>();

  public async store(
    patientId: string,
    file: { name: string; size: number; type: string; content: string | Blob },
    uploadedBy = 'u1'
  ): Promise<StoredDocumentMetadata> {
    const id = `doc-${crypto.randomUUID()}`;
    const metadata: StoredDocumentMetadata = {
      id,
      patientId,
      originalFileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      sha256Checksum: `demo-sha256-${Date.now().toString(16)}`,
      storageUri: `demo://vault/${patientId}/${id}/${file.name}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      encryptionStatus: 'Demo-Unencrypted',
    };

    this.storage.set(id, { metadata, content: file.content });
    return metadata;
  }

  public async retrieve(documentId: string): Promise<string | Blob> {
    const record = this.storage.get(documentId);
    if (!record) {
      throw new Error(`Document ${documentId} not found in storage.`);
    }
    return record.content;
  }

  public async delete(documentId: string): Promise<void> {
    this.storage.delete(documentId);
  }

  public async getMetadata(documentId: string): Promise<StoredDocumentMetadata | null> {
    return this.storage.get(documentId)?.metadata || null;
  }
}

export const documentStorage = new MockClientDocumentStorageProvider();
