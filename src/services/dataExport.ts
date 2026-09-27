// Health Data Export Service
// Generates structured JSON exports of patient health data.
// In production, this would support FHIR R4, HL7 CDA, and CSV formats
// and would be server-side with proper access control and audit logging.

import {
  demoPatient,
  demoConditions,
  demoMedications,
  demoLabTests,
  demoHealthEvents,
  demoNutritionEntries,
} from '@/data/patient';
import type { Patient, Condition, Medication, LabTest, HealthEvent, NutritionEntry } from '@/types';
import { auditLog } from './auditLog';

export interface ExportOptions {
  includeDemographics?: boolean;
  includeConditions?: boolean;
  includeMedications?: boolean;
  includeLabs?: boolean;
  includeEvents?: boolean;
  includeNutrition?: boolean;
}

export interface ExportMetadata {
  timestamp: string;
  formatVersion: string;
  exportedBy: string;
  patientId: string;
  exportType: 'full' | 'partial';
  disclaimer: string;
}

export interface HealthDataExport {
  metadata: ExportMetadata;
  patient?: Partial<Patient>;
  conditions?: Condition[];
  medications?: Medication[];
  labResults?: LabTest[];
  healthEvents?: HealthEvent[];
  nutritionEntries?: NutritionEntry[];
}

class DataExportService {
  /**
   * Generates a structured health data export.
   * In production, this would:
   * - Verify user authorization before export
   * - Log the export event to the audit trail
   * - Support FHIR/HL7 output formats
   * - Apply data minimization (export only what's needed)
   */
  public exportHealthData(
    patientId: string = 'p1', 
    options?: ExportOptions,
    exportedByUser?: { userId: string; userName: string; role: string }
  ): HealthDataExport {
    const opts: Required<ExportOptions> = {
      includeDemographics: true,
      includeConditions: true,
      includeMedications: true,
      includeLabs: true,
      includeEvents: true,
      includeNutrition: true,
      ...options,
    };

    const userName = exportedByUser?.userName || 'Demo User';
    const userId = exportedByUser?.userId || 'u1';
    const userRole = exportedByUser?.role || 'PATIENT';

    const metadata: ExportMetadata = {
      timestamp: new Date().toISOString(),
      formatVersion: '1.0.0',
      exportedBy: `${userName} (${userRole})`,
      patientId,
      exportType: Object.values(opts).every(v => v) ? 'full' : 'partial',
      disclaimer: 'SYNTHETIC DEMO DATA — Not a real patient record. For testing and demonstration only.',
    };

    const exportData: HealthDataExport = { metadata };

    if (opts.includeDemographics) {
      exportData.patient = {
        id: demoPatient.id,
        name: demoPatient.name,
        dateOfBirth: demoPatient.dateOfBirth,
        age: demoPatient.age,
        gender: demoPatient.gender,
        bloodGroup: demoPatient.bloodGroup,
      };
    }

    if (opts.includeConditions) {
      exportData.conditions = demoConditions;
    }

    if (opts.includeMedications) {
      exportData.medications = demoMedications;
    }

    if (opts.includeLabs) {
      // Filter to last 6 months of lab results
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      exportData.labResults = demoLabTests.filter(
        (lab: LabTest) => new Date(lab.date) >= sixMonthsAgo
      );
    }

    if (opts.includeEvents) {
      exportData.healthEvents = demoHealthEvents;
    }

    if (opts.includeNutrition) {
      exportData.nutritionEntries = demoNutritionEntries;
    }

    // Log the audit event for data export
    auditLog.logAuditEvent({
      action: 'DATA_EXPORT',
      userId,
      userRole,
      userName,
      targetResource: `Patient/${patientId}/ExportJSON`,
      targetPatientId: patientId,
      outcome: 'success',
      details: `Generated structured health data export (${metadata.exportType})`
    });

    return exportData;
  }

  /** Triggers a browser download of JSON data */
  public downloadAsJSON(data: HealthDataExport, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Returns a summary of what would be exported (for preview UI) */
  public getExportPreview(patientId: string = 'p1') {
    return {
      patientId,
      demographicsAvailable: true,
      conditionsCount: demoConditions.length,
      medicationsCount: demoMedications.length,
      labResultsCount: demoLabTests.length,
      healthEventsCount: demoHealthEvents.length,
      nutritionEntriesCount: demoNutritionEntries.length,
    };
  }
}

export const dataExport = new DataExportService();
