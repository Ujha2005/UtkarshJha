import { describe, it, expect } from 'vitest';
import {
  toFhirPatient,
  fromFhirPatient,
  toFhirCondition,
  toFhirObservation,
  toFhirMedicationRequest,
  toFhirDiagnosticReport,
  toFhirAllergyIntolerance,
  toFhirDocumentReference,
} from '@/services/api/mappers/fhirMapper';
import type { Patient, Condition, LabResult, Medication, Report, Allergy } from '@/types';
import type { IngestedDocument } from '@/types/ingestion';

describe('FHIR R4 Bidirectional Mapping Layer', () => {
  const samplePatient: Patient = {
    id: 'p1',
    name: 'Rajesh Kumar Sharma',
    dateOfBirth: '1965-04-12',
    age: 61,
    gender: 'male',
    bloodGroup: 'B+',
    phone: '+91 98765 43210',
    email: 'rajesh.sharma@example.com',
    emergencyContact: {
      name: 'Sunita Sharma',
      relationship: 'Spouse',
      phone: '+91 98765 43211',
    },
    primaryDoctor: 'd1',
    insuranceId: 'INS-2024-889',
  };

  it('maps CAREGRAPH Patient -> FHIR R4 Patient', () => {
    const fhir = toFhirPatient(samplePatient);
    expect(fhir.resourceType).toBe('Patient');
    expect(fhir.id).toBe('p1');
    expect(fhir.gender).toBe('male');
    expect(fhir.birthDate).toBe('1965-04-12');
    expect(fhir.name[0].family).toBe('Sharma');
    expect(fhir.identifier).toHaveLength(2);
    expect(fhir.generalPractitioner?.[0].reference).toBe('Practitioner/d1');
  });

  it('maps FHIR R4 Patient -> CAREGRAPH Patient (reverse mapping)', () => {
    const fhir = toFhirPatient(samplePatient);
    const roundTrip = fromFhirPatient(fhir);
    expect(roundTrip.id).toBe('p1');
    expect(roundTrip.name).toBe('Rajesh Kumar Sharma');
    expect(roundTrip.gender).toBe('male');
    expect(roundTrip.dateOfBirth).toBe('1965-04-12');
    expect(roundTrip.email).toBe('rajesh.sharma@example.com');
  });

  it('maps Condition -> FHIR R4 Condition', () => {
    const cond: Condition = {
      id: 'c1',
      name: 'Type 2 Diabetes Mellitus',
      diagnosedDate: '2019-03-15',
      status: 'managed',
      severity: 'moderate',
      diagnosedBy: 'd1',
      notes: 'HbA1c target < 7.0%',
    };
    const fhir = toFhirCondition(cond, 'p1');
    expect(fhir.resourceType).toBe('Condition');
    expect(fhir.code.text).toBe('Type 2 Diabetes Mellitus');
    expect(fhir.subject.reference).toBe('Patient/p1');
    expect(fhir.clinicalStatus.coding[0].code).toBe('active');
    expect(fhir.recorder?.reference).toBe('Practitioner/d1');
  });

  it('maps LabResult -> FHIR R4 Observation', () => {
    const lab: LabResult = {
      parameter: 'HbA1c',
      value: 7.2,
      unit: '%',
      referenceRange: '< 5.7 %',
      status: 'high',
    };
    const fhir = toFhirObservation(lab, 'Comprehensive Metabolic Panel', '2026-08-10', 'p1');
    expect(fhir.resourceType).toBe('Observation');
    expect(fhir.valueQuantity?.value).toBe(7.2);
    expect(fhir.valueQuantity?.unit).toBe('%');
    expect(fhir.interpretation?.[0].coding[0].code).toBe('H');
  });

  it('maps Medication -> FHIR R4 MedicationRequest', () => {
    const med: Medication = {
      id: 'm1',
      name: 'Metformin Hydrochloride',
      dose: '500mg',
      frequency: 'twice daily with meals',
      route: 'Oral',
      startDate: '2019-03-20',
      prescribedBy: 'd1',
      relatedCondition: 'c1',
      status: 'active',
      notes: 'Take after food',
    };
    const fhir = toFhirMedicationRequest(med, 'p1');
    expect(fhir.resourceType).toBe('MedicationRequest');
    expect(fhir.status).toBe('active');
    expect(fhir.medicationCodeableConcept.text).toBe('Metformin Hydrochloride');
    expect(fhir.dosageInstruction?.[0].text).toContain('500mg');
  });

  it('maps Report -> FHIR R4 DiagnosticReport', () => {
    const rpt: Report = {
      id: 'rpt-1',
      title: 'Lipid Panel',
      date: '2026-08-15',
      type: 'blood_test',
      doctor: 'Dr. Rajan Mehta',
      facility: 'Care Diagnostics',
      summary: 'Elevated LDL cholesterol',
      findings: ['Total Cholesterol: 210 mg/dL', 'LDL: 135 mg/dL'],
      relatedConditions: ['c2'],
      relatedMedications: ['m2'],
      relatedLabTests: ['lt-1'],
      status: 'final',
    };
    const fhir = toFhirDiagnosticReport(rpt, 'p1');
    expect(fhir.resourceType).toBe('DiagnosticReport');
    expect(fhir.status).toBe('final');
    expect(fhir.code.text).toBe('Lipid Panel');
    expect(fhir.conclusion).toContain('Elevated LDL');
  });

  it('maps Allergy -> FHIR R4 AllergyIntolerance', () => {
    const allergy: Allergy = {
      id: 'al-1',
      allergen: 'Penicillin',
      reaction: 'Urticaria / Skin Rash',
      severity: 'severe',
      diagnosedDate: '2015-06-10',
    };
    const fhir = toFhirAllergyIntolerance(allergy, 'p1');
    expect(fhir.resourceType).toBe('AllergyIntolerance');
    expect(fhir.code.text).toBe('Penicillin');
    expect(fhir.criticality).toBe('high');
  });

  it('maps IngestedDocument -> FHIR R4 DocumentReference', () => {
    const doc: IngestedDocument = {
      id: 'doc-123',
      name: 'discharge_summary.pdf',
      fileSize: 1048576,
      fileType: 'application/pdf',
      uploadedAt: '2026-09-01T10:00:00Z',
      category: 'discharge_summary',
      facility: 'City Hospital',
      rawText: 'Discharge Summary...',
      status: 'committed',
      extractedEntities: [],
      duplicateCount: 0,
      conflictCount: 0,
      confidenceAverage: 0.95,
    };
    const fhir = toFhirDocumentReference(doc, 'p1');
    expect(fhir.resourceType).toBe('DocumentReference');
    expect(fhir.status).toBe('current');
    expect(fhir.content[0].attachment.title).toBe('discharge_summary.pdf');
  });
});
