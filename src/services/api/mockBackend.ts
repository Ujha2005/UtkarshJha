// Mock Backend Provider for CAREGRAPH Demo Architecture
// Encapsulates the synthetic dataset (Rajesh Kumar Sharma, p1) behind the IBackendProvider interface.
// In production, this is swapped for an HttpBackendProvider without modifying frontend presentation layers.

import type {
  IBackendProvider,
  ApiResponse,
  PatientRecordBundle,
  CommitResult,
} from './backendProvider';
import {
  demoPatient,
  demoConditions,
  demoMedications,
  demoLabTrends,
  demoReports,
  demoHealthEvents,
  demoNutritionEntries,
  demoDoctors,
  demoAllergies,
  demoSymptoms,
  buildHealthGraph,
} from '@/data/patient';
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
  GraphNode,
  GraphLink,
} from '@/types';
import type { IngestedDocument, ExtractedEntity } from '@/types/ingestion';
import { consentService, type AccessGrant, type ConsentRecord } from '@/services/consentService';
import { auditLog, type AuditEntry, type AuditFilter } from '@/services/auditLog';
import { authService } from '@/auth/authService';
import type { User, LoginCredentials } from '@/auth/authTypes';
import { NotFoundError, UnauthorizedError } from './errors';

export class MockBackendProvider implements IBackendProvider {
  public readonly mode = 'demo' as const;

  // In-memory working copies for dynamic mutations in demo mode
  private conditions: Condition[];
  private medications: Medication[];
  private labTrends: LabTrend[];
  private reports: Report[];
  private healthEvents: HealthEvent[];
  private nutritionEntries: NutritionEntry[];
  private ingestedDocuments: IngestedDocument[];

  constructor() {
    this.conditions = JSON.parse(JSON.stringify(demoConditions));
    this.medications = JSON.parse(JSON.stringify(demoMedications));
    this.labTrends = JSON.parse(JSON.stringify(demoLabTrends));
    this.reports = JSON.parse(JSON.stringify(demoReports));
    this.healthEvents = JSON.parse(JSON.stringify(demoHealthEvents));
    this.nutritionEntries = JSON.parse(JSON.stringify(demoNutritionEntries));
    this.ingestedDocuments = [];
  }

  private simulateDelay<T>(data: T, delay = 250): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
  }

  private success<T>(data: T): ApiResponse<T> {
    return { success: true, data, statusCode: 200 };
  }

  private error<T>(message: string, statusCode = 400): ApiResponse<T> {
    return { success: false, error: message, statusCode };
  }

  // --- Authentication ---

  public async authenticate(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    const user = await authService.authenticateUser(credentials);
    if (!user) {
      return this.simulateDelay(this.error('Invalid demo username or password', 401), 300);
    }
    return this.simulateDelay(this.success(user), 300);
  }

  public async logout(_sessionId: string): Promise<ApiResponse<void>> {
    return this.simulateDelay(this.success(undefined), 150);
  }

  public async verifySession(sessionId: string): Promise<ApiResponse<boolean>> {
    return this.simulateDelay(this.success(Boolean(sessionId)), 100);
  }

  // --- Patient & Longitudinal Records ---

  public getInitialBundle(_patientId = 'p1'): PatientRecordBundle {
    return {
      patient: JSON.parse(JSON.stringify(demoPatient)),
      conditions: JSON.parse(JSON.stringify(this.conditions)),
      medications: JSON.parse(JSON.stringify(this.medications)),
      labTrends: JSON.parse(JSON.stringify(this.labTrends)),
      reports: JSON.parse(JSON.stringify(this.reports)),
      healthEvents: JSON.parse(JSON.stringify(this.healthEvents)),
      nutritionEntries: JSON.parse(JSON.stringify(this.nutritionEntries)),
      doctors: JSON.parse(JSON.stringify(demoDoctors)),
      allergies: JSON.parse(JSON.stringify(demoAllergies)),
      symptoms: JSON.parse(JSON.stringify(demoSymptoms)),
      healthGraph: this.computeHealthGraph(),
      ingestedDocuments: JSON.parse(JSON.stringify(this.ingestedDocuments)),
    };
  }

  public async getPatient(patientId: string): Promise<ApiResponse<Patient>> {
    if (patientId === demoPatient.id || patientId === 'p1') {
      return this.simulateDelay(this.success(JSON.parse(JSON.stringify(demoPatient))), 200);
    }
    return this.simulateDelay(this.error(new NotFoundError('Patient', patientId).message, 404), 200);
  }

  public async getPatientRecords(patientId: string): Promise<ApiResponse<PatientRecordBundle>> {
    if (patientId !== demoPatient.id && patientId !== 'p1') {
      return this.simulateDelay(this.error(new NotFoundError('Patient', patientId).message, 404), 200);
    }

    const bundle: PatientRecordBundle = {
      patient: JSON.parse(JSON.stringify(demoPatient)),
      conditions: JSON.parse(JSON.stringify(this.conditions)),
      medications: JSON.parse(JSON.stringify(this.medications)),
      labTrends: JSON.parse(JSON.stringify(this.labTrends)),
      reports: JSON.parse(JSON.stringify(this.reports)),
      healthEvents: JSON.parse(JSON.stringify(this.healthEvents)),
      nutritionEntries: JSON.parse(JSON.stringify(this.nutritionEntries)),
      doctors: JSON.parse(JSON.stringify(demoDoctors)),
      allergies: JSON.parse(JSON.stringify(demoAllergies)),
      symptoms: JSON.parse(JSON.stringify(demoSymptoms)),
      healthGraph: this.computeHealthGraph(),
      ingestedDocuments: JSON.parse(JSON.stringify(this.ingestedDocuments)),
    };

    return this.simulateDelay(this.success(bundle), 300);
  }

  public async resetToBaseline(_patientId: string): Promise<ApiResponse<PatientRecordBundle>> {
    this.conditions = JSON.parse(JSON.stringify(demoConditions));
    this.medications = JSON.parse(JSON.stringify(demoMedications));
    this.labTrends = JSON.parse(JSON.stringify(demoLabTrends));
    this.reports = JSON.parse(JSON.stringify(demoReports));
    this.healthEvents = JSON.parse(JSON.stringify(demoHealthEvents));
    this.nutritionEntries = JSON.parse(JSON.stringify(demoNutritionEntries));
    this.ingestedDocuments = [];

    const bundle: PatientRecordBundle = {
      patient: JSON.parse(JSON.stringify(demoPatient)),
      conditions: JSON.parse(JSON.stringify(this.conditions)),
      medications: JSON.parse(JSON.stringify(this.medications)),
      labTrends: JSON.parse(JSON.stringify(this.labTrends)),
      reports: JSON.parse(JSON.stringify(this.reports)),
      healthEvents: JSON.parse(JSON.stringify(this.healthEvents)),
      nutritionEntries: JSON.parse(JSON.stringify(this.nutritionEntries)),
      doctors: JSON.parse(JSON.stringify(demoDoctors)),
      allergies: JSON.parse(JSON.stringify(demoAllergies)),
      symptoms: JSON.parse(JSON.stringify(demoSymptoms)),
      healthGraph: this.computeHealthGraph(),
      ingestedDocuments: [],
    };

    return this.simulateDelay(this.success(bundle), 250);
  }

  // --- Clinical Entities ---

  public async getConditions(_patientId: string): Promise<ApiResponse<Condition[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.conditions))), 150);
  }

  public async getMedications(_patientId: string): Promise<ApiResponse<Medication[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.medications))), 150);
  }

  public async getLabTrends(_patientId: string): Promise<ApiResponse<LabTrend[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.labTrends))), 150);
  }

  public async getReports(_patientId: string): Promise<ApiResponse<Report[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.reports))), 150);
  }

  public async getHealthEvents(_patientId: string): Promise<ApiResponse<HealthEvent[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.healthEvents))), 150);
  }

  public async getNutritionEntries(_patientId: string): Promise<ApiResponse<NutritionEntry[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.nutritionEntries))), 150);
  }

  public async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(demoDoctors))), 100);
  }

  public async getAllergies(_patientId: string): Promise<ApiResponse<Allergy[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(demoAllergies))), 100);
  }

  public async getHealthGraph(_patientId: string): Promise<ApiResponse<HealthGraph>> {
    return this.simulateDelay(this.success(this.computeHealthGraph()), 200);
  }

  private computeHealthGraph(): HealthGraph {
    const base = buildHealthGraph();
    const dynamicNodes: GraphNode[] = [...base.nodes];
    const dynamicLinks: GraphLink[] = [...base.links];

    this.medications.forEach(m => {
      if (!dynamicNodes.some(n => n.id === m.id)) {
        dynamicNodes.push({
          id: m.id,
          label: `${m.name} (Ingested)`,
          type: 'medication',
          color: '#10b981',
        });
        if (m.relatedCondition) {
          dynamicLinks.push({
            source: m.relatedCondition,
            target: m.id,
            label: 'treated with',
          });
        }
      }
    });

    return { nodes: dynamicNodes, links: dynamicLinks };
  }

  // --- Ingestion & Provenance ---

  public async getIngestedDocuments(_patientId: string): Promise<ApiResponse<IngestedDocument[]>> {
    return this.simulateDelay(this.success(JSON.parse(JSON.stringify(this.ingestedDocuments))), 150);
  }

  public async uploadDocument(
    _patientId: string,
    document: IngestedDocument
  ): Promise<ApiResponse<IngestedDocument>> {
    this.ingestedDocuments.unshift(document);
    return this.simulateDelay(this.success(document), 400);
  }

  public async updateEntityStatus(
    docId: string,
    entityId: string,
    status: ExtractedEntity['reviewStatus']
  ): Promise<ApiResponse<void>> {
    const doc = this.ingestedDocuments.find(d => d.id === docId);
    if (doc) {
      const entity = doc.extractedEntities.find(e => e.id === entityId);
      if (entity) {
        entity.reviewStatus = status;
      }
    }
    return this.simulateDelay(this.success(undefined), 100);
  }

  public async editEntity(
    docId: string,
    entityId: string,
    changes: Partial<ExtractedEntity>
  ): Promise<ApiResponse<void>> {
    const doc = this.ingestedDocuments.find(d => d.id === docId);
    if (doc) {
      const entityIndex = doc.extractedEntities.findIndex(e => e.id === entityId);
      if (entityIndex !== -1) {
        doc.extractedEntities[entityIndex] = {
          ...doc.extractedEntities[entityIndex],
          ...changes,
          userEdited: true,
        };
      }
    }
    return this.simulateDelay(this.success(undefined), 100);
  }

  public async commitAcceptedEntities(docId: string): Promise<ApiResponse<CommitResult>> {
    const doc = this.ingestedDocuments.find(d => d.id === docId);
    if (!doc) {
      return this.simulateDelay(this.error('Document not found', 404), 150);
    }

    const acceptedEntities = doc.extractedEntities.filter(
      e => e.reviewStatus === 'user_confirmed' || e.reviewStatus === 'clinician_verified'
    );

    if (acceptedEntities.length === 0) {
      return this.simulateDelay(this.error('No accepted entities to commit', 400), 150);
    }

    const newReportId = `rpt-ingested-${Date.now()}`;
    const findingsList: string[] = [];
    const newMedIds: string[] = [];

    // 1. Commit lab results
    acceptedEntities
      .filter(e => e.entityType === 'lab_result')
      .forEach(lab => {
        const numVal = typeof lab.value === 'number' ? lab.value : parseFloat(String(lab.value));
        if (!isNaN(numVal)) {
          findingsList.push(`${lab.name}: ${numVal} ${lab.unit || ''} (Verified Ingestion)`);
          this.labTrends = this.labTrends.map(trend => {
            if (
              trend.parameter.toLowerCase() === lab.name.toLowerCase() ||
              trend.parameter.toLowerCase().includes(lab.name.toLowerCase()) ||
              lab.name.toLowerCase().includes(trend.parameter.toLowerCase().split(' ')[0])
            ) {
              const newData = [...trend.data, { date: lab.date, value: numVal }].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              return { ...trend, data: newData };
            }
            return trend;
          });
        }
      });

    // 2. Commit medications
    acceptedEntities
      .filter(e => e.entityType === 'medication')
      .forEach(med => {
        const medId = `m-ingested-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        newMedIds.push(medId);
        findingsList.push(`Rx: ${med.name} ${med.value || ''} (Prescribed)`);

        const newMed: Medication = {
          id: medId,
          name: med.name,
          dose: String(med.value || '10mg'),
          frequency: 'once daily',
          route: 'Oral',
          startDate: med.date,
          prescribedBy: 'd2',
          relatedCondition: 'c2',
          status: 'active',
          notes: `Ingested from ${doc.name} (Verified ${new Date().toLocaleDateString()})`,
        };

        if (med.name.toLowerCase().includes('rosuvastatin')) {
          this.medications = this.medications.map(m =>
            m.name.toLowerCase().includes('atorvastatin')
              ? { ...m, status: 'discontinued' as const, endDate: med.date, notes: 'Replaced by Rosuvastatin' }
              : m
          ).concat(newMed);
        } else {
          this.medications.push(newMed);
        }
      });

    // 3. Create new report
    const newReport: Report = {
      id: newReportId,
      title: doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      date: doc.extractedEntities[0]?.date || new Date().toISOString().split('T')[0],
      type: doc.category === 'prescription' ? 'doctor_note' : doc.category === 'imaging_report' ? 'imaging' : 'blood_test',
      doctor: 'd2',
      facility: doc.facility || 'Verified Diagnostic Facility',
      summary: `Ingested from uploaded document "${doc.name}". ${acceptedEntities.length} clinical entities verified and committed to patient record.`,
      findings: findingsList.length > 0 ? findingsList : ['Extracted medical documentation confirmed.'],
      relatedConditions: ['c2', 'c3'],
      relatedMedications: newMedIds,
      relatedLabTests: [],
      status: 'final',
    };
    this.reports.unshift(newReport);

    // 4. Create timeline event
    const newTimelineEvent: HealthEvent = {
      id: `e-ingested-${Date.now()}`,
      date: newReport.date,
      type: doc.category === 'prescription' ? 'medication' : 'lab_test',
      title: `Ingested: ${doc.name.replace(/\.[^/.]+$/, '')}`,
      description: `Verified document ingestion with ${acceptedEntities.length} committed entities from ${doc.facility}.`,
      relatedEntityId: newReportId,
      doctor: 'd2',
      sourceReportId: newReportId,
    };
    this.healthEvents.unshift(newTimelineEvent);

    // 5. Update doc status
    doc.status = 'committed';

    return this.simulateDelay(
      this.success({
        committedCount: acceptedEntities.length,
        createdReportId: newReportId,
      }),
      400
    );
  }

  // --- Consent & Access Grants ---

  public async getAccessGrants(patientId: string): Promise<ApiResponse<AccessGrant[]>> {
    const grants = consentService.getAccessGrants(patientId);
    return this.simulateDelay(this.success(grants), 150);
  }

  public async grantAccess(
    grant: Omit<AccessGrant, 'id' | 'grantedAt' | 'isActive'>
  ): Promise<ApiResponse<AccessGrant>> {
    const result = consentService.grantAccess(grant);
    return this.simulateDelay(this.success(result), 250);
  }

  public async revokeAccess(grantId: string): Promise<ApiResponse<void>> {
    consentService.revokeAccess(grantId);
    return this.simulateDelay(this.success(undefined), 200);
  }

  public async getConsentRecords(patientId: string): Promise<ApiResponse<ConsentRecord[]>> {
    const consents = consentService.getConsentRecords(patientId);
    return this.simulateDelay(this.success(consents), 150);
  }

  public async updateConsent(
    consentId: string,
    status: 'granted' | 'revoked' | 'expired'
  ): Promise<ApiResponse<void>> {
    consentService.updateConsent(consentId, status);
    return this.simulateDelay(this.success(undefined), 200);
  }

  // --- Audit Log ---

  public async getAuditLog(filters?: AuditFilter): Promise<ApiResponse<AuditEntry[]>> {
    const logs = auditLog.getAuditLog(filters);
    return this.simulateDelay(this.success(logs), 200);
  }

  public async logAuditEvent(
    event: Omit<AuditEntry, 'id' | 'timestamp'>
  ): Promise<ApiResponse<AuditEntry>> {
    const logged = auditLog.logAuditEvent(event);
    return this.simulateDelay(this.success(logged), 100);
  }
}
