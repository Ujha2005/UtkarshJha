// Types for Phase 5 Medical Document Ingestion, Provenance & Review

export type DocumentCategory =
  | 'lab_report'
  | 'prescription'
  | 'doctor_note'
  | 'imaging_report'
  | 'discharge_summary'
  | 'procedure_report'
  | 'other';

export type IngestionStatus =
  | 'uploaded'
  | 'processing'
  | 'extracting'
  | 'review_required'
  | 'committed'
  | 'failed';

export type EntityReviewStatus =
  | 'ai_extracted'
  | 'user_confirmed'
  | 'clinician_verified'
  | 'rejected';

export type ExtractedEntityType =
  | 'lab_result'
  | 'condition'
  | 'medication'
  | 'procedure'
  | 'symptom'
  | 'vital'
  | 'clinical_note';

export interface ExtractedEntity {
  id: string;
  entityType: ExtractedEntityType;
  name: string;
  value?: string | number;
  unit?: string;
  referenceRange?: string;
  date: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  sourcePage?: number;
  snippet: string;
  confidence: number; // 0.0 - 1.0
  reviewStatus: EntityReviewStatus;
  userEdited?: boolean;
  duplicateOfId?: string;
  duplicateRationale?: string;
  conflictWithId?: string;
  conflictRationale?: string;
  doctorName?: string;
  facility?: string;
}

export interface IngestedDocument {
  id: string;
  name: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  category: DocumentCategory;
  facility: string;
  doctorName?: string;
  rawText: string;
  status: IngestionStatus;
  extractedEntities: ExtractedEntity[];
  duplicateCount: number;
  conflictCount: number;
  confidenceAverage: number;
  failureReason?: string;
}
