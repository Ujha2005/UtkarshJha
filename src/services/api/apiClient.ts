// Unified API Client for CAREGRAPH
// Presentation layer interacts with the backend solely through this client.
// Provider can be dynamically swapped (e.g. MockBackendProvider -> HttpBackendProvider) without changing UI.

import type { IBackendProvider, PatientRecordBundle, CommitResult } from './backendProvider';
import { MockBackendProvider } from './mockBackend';
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
  HealthGraph,
} from '@/types';
import type { IngestedDocument, ExtractedEntity } from '@/types/ingestion';
import type { AccessGrant, ConsentRecord } from '@/services/consentService';
import type { AuditEntry, AuditFilter } from '@/services/auditLog';
import type { User, LoginCredentials } from '@/auth/authTypes';
import { ApiError } from './errors';

export class ApiClient {
  private provider: IBackendProvider;

  constructor(provider: IBackendProvider = new MockBackendProvider()) {
    this.provider = provider;
  }

  public setProvider(provider: IBackendProvider): void {
    this.provider = provider;
  }

  public getProvider(): IBackendProvider {
    return this.provider;
  }

  public get mode(): 'demo' | 'production' {
    return this.provider.mode;
  }

  // Helper to unwrap ApiResponse and throw ApiError on failure
  private async unwrap<T>(promise: Promise<{ success: boolean; data?: T; error?: string; statusCode: number }>): Promise<T> {
    const res = await promise;
    if (!res.success) {
      throw new ApiError(res.statusCode, 'INTERNAL_SERVER_ERROR', res.error || 'API operation failed');
    }
    return res.data as T;
  }

  // --- Auth Namespace ---
  public readonly auth = {
    login: (credentials: LoginCredentials): Promise<User> =>
      this.unwrap(this.provider.authenticate(credentials)),

    logout: (sessionId: string): Promise<void> =>
      this.unwrap(this.provider.logout(sessionId)),

    verifySession: (sessionId: string): Promise<boolean> =>
      this.unwrap(this.provider.verifySession(sessionId)),
  };

  // --- Patient Namespace ---
  public readonly patient = {
    getInitialBundle: (patientId = 'p1'): PatientRecordBundle => {
      if (this.provider.getInitialBundle) {
        return this.provider.getInitialBundle(patientId);
      }
      throw new Error('Provider does not support synchronous initial bundle');
    },

    get: (patientId: string): Promise<Patient> =>
      this.unwrap(this.provider.getPatient(patientId)),

    getRecords: (patientId: string): Promise<PatientRecordBundle> =>
      this.unwrap(this.provider.getPatientRecords(patientId)),

    resetToBaseline: (patientId: string): Promise<PatientRecordBundle> =>
      this.unwrap(this.provider.resetToBaseline(patientId)),
  };

  // --- Clinical Entities Namespace ---
  public readonly records = {
    getConditions: (patientId: string): Promise<Condition[]> =>
      this.unwrap(this.provider.getConditions(patientId)),

    getMedications: (patientId: string): Promise<Medication[]> =>
      this.unwrap(this.provider.getMedications(patientId)),

    getLabTrends: (patientId: string): Promise<LabTrend[]> =>
      this.unwrap(this.provider.getLabTrends(patientId)),

    getReports: (patientId: string): Promise<Report[]> =>
      this.unwrap(this.provider.getReports(patientId)),

    getHealthEvents: (patientId: string): Promise<HealthEvent[]> =>
      this.unwrap(this.provider.getHealthEvents(patientId)),

    getNutritionEntries: (patientId: string): Promise<NutritionEntry[]> =>
      this.unwrap(this.provider.getNutritionEntries(patientId)),

    getDoctors: (): Promise<Doctor[]> =>
      this.unwrap(this.provider.getDoctors()),

    getAllergies: (patientId: string): Promise<Allergy[]> =>
      this.unwrap(this.provider.getAllergies(patientId)),

    getHealthGraph: (patientId: string): Promise<HealthGraph> =>
      this.unwrap(this.provider.getHealthGraph(patientId)),
  };

  // --- Document Ingestion Namespace ---
  public readonly documents = {
    list: (patientId: string): Promise<IngestedDocument[]> =>
      this.unwrap(this.provider.getIngestedDocuments(patientId)),

    upload: (patientId: string, document: IngestedDocument): Promise<IngestedDocument> =>
      this.unwrap(this.provider.uploadDocument(patientId, document)),

    updateEntityStatus: (
      docId: string,
      entityId: string,
      status: ExtractedEntity['reviewStatus']
    ): Promise<void> =>
      this.unwrap(this.provider.updateEntityStatus(docId, entityId, status)),

    editEntity: (
      docId: string,
      entityId: string,
      changes: Partial<ExtractedEntity>
    ): Promise<void> =>
      this.unwrap(this.provider.editEntity(docId, entityId, changes)),

    commitAcceptedEntities: (docId: string): Promise<CommitResult> =>
      this.unwrap(this.provider.commitAcceptedEntities(docId)),
  };

  // --- Consent & Access Grants Namespace ---
  public readonly consent = {
    getGrants: (patientId: string): Promise<AccessGrant[]> =>
      this.unwrap(this.provider.getAccessGrants(patientId)),

    grantAccess: (grant: Omit<AccessGrant, 'id' | 'grantedAt' | 'isActive'>): Promise<AccessGrant> =>
      this.unwrap(this.provider.grantAccess(grant)),

    revokeAccess: (grantId: string): Promise<void> =>
      this.unwrap(this.provider.revokeAccess(grantId)),

    getConsents: (patientId: string): Promise<ConsentRecord[]> =>
      this.unwrap(this.provider.getConsentRecords(patientId)),

    updateConsent: (
      consentId: string,
      status: 'granted' | 'revoked' | 'expired'
    ): Promise<void> =>
      this.unwrap(this.provider.updateConsent(consentId, status)),
  };

  // --- Audit Namespace ---
  public readonly audit = {
    getLogs: (filters?: AuditFilter): Promise<AuditEntry[]> =>
      this.unwrap(this.provider.getAuditLog(filters)),

    logEvent: (event: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> =>
      this.unwrap(this.provider.logAuditEvent(event)),
  };
}

export const apiClient = new ApiClient();
