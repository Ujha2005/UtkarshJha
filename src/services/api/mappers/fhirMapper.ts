// FHIR R4 Bidirectional Mapping Layer for CAREGRAPH
// Maps internal CAREGRAPH models <-> HL7 FHIR Release 4 standard resources.
// Ensures CAREGRAPH clinical records can be ingested from or exported to any FHIR-compliant EHR.

import type {
  Patient,
  Condition,
  Medication,
  Report,
  Allergy,
  LabResult,
} from '@/types';
import type { IngestedDocument } from '@/types/ingestion';

// ==========================================
// 1. PATIENT <-> FHIR R4 Patient
// ==========================================

export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier?: { system: string; value: string }[];
  active: boolean;
  name: { use: string; family: string; given: string[]; text: string }[];
  telecom?: { system: string; value: string; use: string }[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  contact?: {
    relationship: { text: string }[];
    name: { text: string };
    telecom: { system: string; value: string }[];
  }[];
  generalPractitioner?: { reference: string; display?: string }[];
}

export function toFhirPatient(patient: Patient): FhirPatient {
  const parts = patient.name.trim().split(' ');
  const given = parts.slice(0, -1);
  const family = parts[parts.length - 1] || '';

  return {
    resourceType: 'Patient',
    id: patient.id,
    identifier: [
      {
        system: 'https://caregraph.health/uhid',
        value: patient.id,
      },
      ...(patient.insuranceId
        ? [{ system: 'https://caregraph.health/insurance', value: patient.insuranceId }]
        : []),
    ],
    active: true,
    name: [
      {
        use: 'official',
        family,
        given: given.length > 0 ? given : [family],
        text: patient.name,
      },
    ],
    telecom: [
      { system: 'phone', value: patient.phone, use: 'mobile' },
      { system: 'email', value: patient.email, use: 'home' },
    ],
    gender: (patient.gender.toLowerCase() === 'male' ? 'male' : patient.gender.toLowerCase() === 'female' ? 'female' : 'other'),
    birthDate: patient.dateOfBirth,
    contact: [
      {
        relationship: [{ text: patient.emergencyContact.relationship }],
        name: { text: patient.emergencyContact.name },
        telecom: [{ system: 'phone', value: patient.emergencyContact.phone }],
      },
    ],
    generalPractitioner: [
      { reference: `Practitioner/${patient.primaryDoctor}` },
    ],
  };
}

export function fromFhirPatient(fhir: FhirPatient): Patient {
  const primaryName = fhir.name?.[0]?.text || 
    `${fhir.name?.[0]?.given?.join(' ') || ''} ${fhir.name?.[0]?.family || ''}`.trim() || 'Unknown Patient';
  
  const phone = fhir.telecom?.find(t => t.system === 'phone')?.value || '';
  const email = fhir.telecom?.find(t => t.system === 'email')?.value || '';
  const contact = fhir.contact?.[0];

  const birthDate = fhir.birthDate || '1970-01-01';
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return {
    id: fhir.id,
    name: primaryName,
    dateOfBirth: birthDate,
    age,
    gender: fhir.gender || 'other',
    bloodGroup: 'Unknown',
    phone,
    email,
    emergencyContact: {
      name: contact?.name?.text || 'Not Specified',
      relationship: contact?.relationship?.[0]?.text || 'Contact',
      phone: contact?.telecom?.find(t => t.system === 'phone')?.value || '',
    },
    primaryDoctor: fhir.generalPractitioner?.[0]?.reference?.replace('Practitioner/', '') || 'd1',
  };
}

// ==========================================
// 2. CONDITION <-> FHIR R4 Condition
// ==========================================

export interface FhirCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: {
    coding: { system: string; code: string; display: string }[];
  };
  verificationStatus: {
    coding: { system: string; code: string }[];
  };
  severity?: {
    coding: { system: string; code: string; display: string }[];
  };
  code: {
    text: string;
    coding?: { system: string; code: string; display: string }[];
  };
  subject: { reference: string };
  recordedDate: string;
  recorder?: { reference: string };
  note?: { text: string }[];
}

export function toFhirCondition(condition: Condition, patientId: string): FhirCondition {
  const statusMap: Record<Condition['status'], string> = {
    active: 'active',
    managed: 'active',
    resolved: 'resolved',
  };

  const severityMap: Record<Condition['severity'], string> = {
    mild: '255604002',
    moderate: '6736007',
    severe: '24484000',
  };

  return {
    resourceType: 'Condition',
    id: condition.id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: statusMap[condition.status] || 'active',
          display: condition.status,
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
        },
      ],
    },
    severity: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: severityMap[condition.severity] || '6736007',
          display: condition.severity,
        },
      ],
    },
    code: {
      text: condition.name,
    },
    subject: { reference: `Patient/${patientId}` },
    recordedDate: condition.diagnosedDate,
    recorder: { reference: `Practitioner/${condition.diagnosedBy}` },
    note: condition.notes ? [{ text: condition.notes }] : undefined,
  };
}

// ==========================================
// 3. LAB RESULT <-> FHIR R4 Observation
// ==========================================

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary' | 'amended';
  category: { coding: { system: string; code: string; display: string }[] }[];
  code: { text: string };
  subject: { reference: string };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
  };
  referenceRange?: {
    text: string;
  }[];
  interpretation?: {
    coding: { system: string; code: string; display: string }[];
  }[];
}

export function toFhirObservation(
  labResult: LabResult,
  testName: string,
  date: string,
  patientId: string
): FhirObservation {
  const interpMap: Record<LabResult['status'], string> = {
    normal: 'N',
    low: 'L',
    high: 'H',
    critical: 'A',
  };

  return {
    resourceType: 'Observation',
    id: `obs-${testName.toLowerCase().replace(/\s+/g, '-')}-${date}`,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory',
            display: 'Laboratory',
          },
        ],
      },
    ],
    code: { text: labResult.parameter },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: date,
    valueQuantity: {
      value: labResult.value,
      unit: labResult.unit,
      system: 'http://unitsofmeasure.org',
    },
    referenceRange: [
      { text: labResult.referenceRange },
    ],
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: interpMap[labResult.status] || 'N',
            display: labResult.status,
          },
        ],
      },
    ],
  };
}

// ==========================================
// 4. MEDICATION <-> FHIR R4 MedicationRequest
// ==========================================

export interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'stopped';
  intent: 'order';
  medicationCodeableConcept: { text: string };
  subject: { reference: string };
  authoredOn: string;
  requester?: { reference: string };
  dosageInstruction?: {
    text: string;
    route?: { text: string };
  }[];
  note?: { text: string }[];
}

export function toFhirMedicationRequest(
  medication: Medication,
  patientId: string
): FhirMedicationRequest {
  const statusMap: Record<Medication['status'], 'active' | 'completed' | 'stopped'> = {
    active: 'active',
    completed: 'completed',
    discontinued: 'stopped',
  };

  return {
    resourceType: 'MedicationRequest',
    id: medication.id,
    status: statusMap[medication.status] || 'active',
    intent: 'order',
    medicationCodeableConcept: { text: medication.name },
    subject: { reference: `Patient/${patientId}` },
    authoredOn: medication.startDate,
    requester: { reference: `Practitioner/${medication.prescribedBy}` },
    dosageInstruction: [
      {
        text: `${medication.dose}, ${medication.frequency}`,
        route: medication.route ? { text: medication.route } : undefined,
      },
    ],
    note: medication.notes ? [{ text: medication.notes }] : undefined,
  };
}

// ==========================================
// 5. REPORT <-> FHIR R4 DiagnosticReport
// ==========================================

export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'final' | 'preliminary' | 'amended';
  category: { text: string }[];
  code: { text: string };
  subject: { reference: string };
  effectiveDateTime: string;
  issued: string;
  performer?: { display: string }[];
  conclusion?: string;
}

export function toFhirDiagnosticReport(
  report: Report,
  patientId: string
): FhirDiagnosticReport {
  return {
    resourceType: 'DiagnosticReport',
    id: report.id,
    status: report.status,
    category: [{ text: report.type }],
    code: { text: report.title },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: report.date,
    issued: new Date(report.date).toISOString(),
    performer: [{ display: `${report.doctor} (${report.facility})` }],
    conclusion: `${report.summary} Findings: ${report.findings.join('; ')}`,
  };
}

// ==========================================
// 6. ALLERGY <-> FHIR R4 AllergyIntolerance
// ==========================================

export interface FhirAllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  id: string;
  clinicalStatus: { coding: { code: string; display: string }[] };
  verificationStatus: { coding: { code: string; display: string }[] };
  type: 'allergy';
  category?: string[];
  criticality: 'low' | 'high' | 'unable-to-assess';
  code: { text: string };
  patient: { reference: string };
  recordedDate: string;
  reaction?: { manifest: { text: string }[] }[];
}

export function toFhirAllergyIntolerance(
  allergy: Allergy,
  patientId: string
): FhirAllergyIntolerance {
  return {
    resourceType: 'AllergyIntolerance',
    id: allergy.id,
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ code: 'confirmed', display: 'Confirmed' }] },
    type: 'allergy',
    criticality: allergy.severity === 'severe' ? 'high' : 'low',
    code: { text: allergy.allergen },
    patient: { reference: `Patient/${patientId}` },
    recordedDate: allergy.diagnosedDate,
    reaction: [{ manifest: [{ text: allergy.reaction }] }],
  };
}

// ==========================================
// 7. INGESTED DOCUMENT <-> FHIR R4 DocumentReference
// ==========================================

export interface FhirDocumentReference {
  resourceType: 'DocumentReference';
  id: string;
  status: 'current';
  type: { text: string };
  category: { text: string }[];
  subject: { reference: string };
  date: string;
  description: string;
  content: {
    attachment: {
      contentType: string;
      title: string;
      size?: number;
    };
  }[];
}

export function toFhirDocumentReference(
  doc: IngestedDocument,
  patientId: string
): FhirDocumentReference {
  return {
    resourceType: 'DocumentReference',
    id: doc.id,
    status: 'current',
    type: { text: doc.category },
    category: [{ text: 'Clinical Note / Document' }],
    subject: { reference: `Patient/${patientId}` },
    date: doc.uploadedAt,
    description: `Uploaded clinical file: ${doc.name}`,
    content: [
      {
        attachment: {
          contentType: doc.fileType,
          title: doc.name,
          size: doc.fileSize,
        },
      },
    ],
  };
}
