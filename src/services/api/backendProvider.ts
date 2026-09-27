// Backend Provider Interface Contract
// Defines the boundary between the CAREGRAPH presentation layer and the data backend.
// Implementations:
// 1. MockBackendProvider (active in demo mode)
// 2. HttpBackendProvider (production REST/FHIR gateway)

import type {
  Patient,
  Condition,
  Medication,
  LabTrend,
  Report,
  HealthEvent,
  NutritionEntry,
  Doctor,
  Allergy,
  Symptom,
  HealthGraph,
} from '@/types';
import type { IngestedDocument, ExtractedEntity } from '@/types/ingestion';
import type { AccessGrant, ConsentRecord } from '@/services/consentService';
import type { AuditEntry, AuditFilter } from '@/services/auditLog';
import type { User, LoginCredentials } from '@/auth/authTypes';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface PatientRecordBundle {
  patient: Patient;
  conditions: Condition[];
  medications: Medication[];
  labTrends: LabTrend[];
  reports: Report[];
  healthEvents: HealthEvent[];
  nutritionEntries: NutritionEntry[];
  doctors: Doctor[];
  allergies: Allergy[];
  symptoms: Symptom[];
  healthGraph: HealthGraph;
  ingestedDocuments: IngestedDocument[];
}

export interface CommitResult {
  committedCount: number;
  createdReportId: string;
}

export interface IBackendProvider {
  readonly mode: 'demo' | 'production';

  // --- Authentication ---
  authenticate(credentials: LoginCredentials): Promise<ApiResponse<User>>;
  logout(sessionId: string): Promise<ApiResponse<void>>;
  verifySession(sessionId: string): Promise<ApiResponse<boolean>>;

  // --- Patient & Longitudinal Records ---
  getInitialBundle?(patientId: string): PatientRecordBundle;
  getPatient(patientId: string): Promise<ApiResponse<Patient>>;
  getPatientRecords(patientId: string): Promise<ApiResponse<PatientRecordBundle>>;
  resetToBaseline(patientId: string): Promise<ApiResponse<PatientRecordBundle>>;

  // --- Clinical Entities ---
  getConditions(patientId: string): Promise<ApiResponse<Condition[]>>;
  getMedications(patientId: string): Promise<ApiResponse<Medication[]>>;
  getLabTrends(patientId: string): Promise<ApiResponse<LabTrend[]>>;
  getReports(patientId: string): Promise<ApiResponse<Report[]>>;
  getHealthEvents(patientId: string): Promise<ApiResponse<HealthEvent[]>>;
  getNutritionEntries(patientId: string): Promise<ApiResponse<NutritionEntry[]>>;
  getDoctors(): Promise<ApiResponse<Doctor[]>>;
  getAllergies(patientId: string): Promise<ApiResponse<Allergy[]>>;
  getHealthGraph(patientId: string): Promise<ApiResponse<HealthGraph>>;

  // --- Ingestion & Provenance ---
  getIngestedDocuments(patientId: string): Promise<ApiResponse<IngestedDocument[]>>;
  uploadDocument(patientId: string, document: IngestedDocument): Promise<ApiResponse<IngestedDocument>>;
  updateEntityStatus(
    docId: string,
    entityId: string,
    status: ExtractedEntity['reviewStatus']
  ): Promise<ApiResponse<void>>;
  editEntity(
    docId: string,
    entityId: string,
    changes: Partial<ExtractedEntity>
  ): Promise<ApiResponse<void>>;
  commitAcceptedEntities(docId: string): Promise<ApiResponse<CommitResult>>;

  // --- Consent & Access Grants ---
  getAccessGrants(patientId: string): Promise<ApiResponse<AccessGrant[]>>;
  grantAccess(grant: Omit<AccessGrant, 'id' | 'grantedAt' | 'isActive'>): Promise<ApiResponse<AccessGrant>>;
  revokeAccess(grantId: string): Promise<ApiResponse<void>>;
  getConsentRecords(patientId: string): Promise<ApiResponse<ConsentRecord[]>>;
  updateConsent(consentId: string, status: 'granted' | 'revoked' | 'expired'): Promise<ApiResponse<void>>;

  // --- Audit Log ---
  getAuditLog(filters?: AuditFilter): Promise<ApiResponse<AuditEntry[]>>;
  logAuditEvent(event: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<ApiResponse<AuditEntry>>;
}
