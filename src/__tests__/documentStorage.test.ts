import { describe, it, expect } from 'vitest';
import { documentStorage } from '@/services/documentStorage';

describe('CAREGRAPH Document Storage Architecture', () => {
  it('stores a document and returns metadata with checksum and URI', async () => {
    const meta = await documentStorage.store('p1', {
      name: 'cbc_report.pdf',
      size: 512000,
      type: 'application/pdf',
      content: 'Sample synthetic PDF content',
    });

    expect(meta.id).toMatch(/^doc-/);
    expect(meta.patientId).toBe('p1');
    expect(meta.originalFileName).toBe('cbc_report.pdf');
    expect(meta.sizeBytes).toBe(512000);
    expect(meta.storageUri).toContain('cbc_report.pdf');
    expect(meta.uploadedAt).toBeDefined();
  });

  it('retrieves stored document content', async () => {
    const meta = await documentStorage.store('p1', {
      name: 'discharge.txt',
      size: 1024,
      type: 'text/plain',
      content: 'Clinical summary text content',
    });

    const content = await documentStorage.retrieve(meta.id);
    expect(content).toBe('Clinical summary text content');
  });

  it('deletes stored document', async () => {
    const meta = await documentStorage.store('p1', {
      name: 'temp.txt',
      size: 100,
      type: 'text/plain',
      content: 'Temporary text',
    });

    await documentStorage.delete(meta.id);
    await expect(documentStorage.retrieve(meta.id)).rejects.toThrow();
  });
});
