// Database Domain Models & API Types
// Represents the normalized, relational/document database schema for the CAREGRAPH backend.

export * from './backendProvider';
export * from './errors';

/**
 * Base database entity interface with audit metadata.
 * Every stored clinical and administrative record inherits these fields.
 */
export interface DbEntityBase {
  id: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  createdBy: string; // User ID
  updatedBy?: string; // User ID
  version: number;
  sourceDocumentId?: string; // Provenance link if extracted from document
  isDeleted?: boolean; // Soft-delete support
}

export interface DbUser extends DbEntityBase {
  username: string;
  email: string;
  passwordHash: string; // Argon2id or bcrypt in production
  role: 'PATIENT' | 'DOCTOR' | 'CAREGIVER' | 'ADMIN';
  displayName: string;
  linkedPatientId?: string;
  linkedPractitionerId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  mfaEnabled: boolean;
}

export interface DbPatient extends DbEntityBase {
  uhid: string; // Unique Healthcare Identifier
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  primaryDoctorId: string;
  insuranceId?: string;
}

export interface DbPractitioner extends DbEntityBase {
  licenseNumber: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

export interface DbCaregiver extends DbEntityBase {
  name: string;
  patientId: string;
  relationship: string;
  phone: string;
  email: string;
  canManageConsents: boolean;
}

export interface DbCondition extends DbEntityBase {
  patientId: string;
  name: string;
  icd10Code?: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'managed';
  severity: 'mild' | 'moderate' | 'severe';
  diagnosedById: string;
  notes?: string;
}

export interface DbMedication extends DbEntityBase {
  patientId: string;
  name: string;
  rxNormCode?: string;
  dose: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedById: string;
  relatedConditionId: string;
  status: 'active' | 'discontinued' | 'completed';
  notes?: string;
}

export interface DbAllergy extends DbEntityBase {
  patientId: string;
  allergen: string;
  snomedCode?: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  diagnosedDate: string;
}

export interface DbObservation extends DbEntityBase {
  patientId: string;
  reportId: string;
  loincCode?: string;
  parameter: string;
  value: number;
  unit: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  referenceRangeText: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  observedAt: string;
}

export interface DbDiagnosticReport extends DbEntityBase {
  patientId: string;
  title: string;
  type: 'blood_test' | 'imaging' | 'procedure' | 'doctor_note' | 'other';
  practitionerId: string;
  facility: string;
  summary: string;
  findings: string[];
  status: 'preliminary' | 'final' | 'amended';
  issuedAt: string;
}

export interface DbDocument extends DbEntityBase {
  patientId: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageUri: string; // S3 / GCS encrypted object path
  sha256Checksum: string;
  category: string;
  status: 'uploaded' | 'processing' | 'extracting' | 'review_required' | 'committed' | 'failed';
  extractedEntitiesCount: number;
  uploadedById: string;
}

export interface DbHealthEvent extends DbEntityBase {
  patientId: string;
  date: string;
  type: 'diagnosis' | 'lab_test' | 'medication' | 'procedure' | 'symptom' | 'visit' | 'report';
  title: string;
  description: string;
  relatedEntityId?: string;
  practitionerId?: string;
  sourceReportId?: string;
}

export interface DbConsent extends DbEntityBase {
  patientId: string;
  consentType: 'data_sharing' | 'research_participation' | 'ai_analysis' | 'emergency_access' | 'caregiver_access';
  status: 'granted' | 'revoked' | 'expired';
  grantedAt: string;
  revokedAt?: string;
  policyUri?: string;
  description: string;
}

export interface DbAccessGrant extends DbEntityBase {
  patientId: string;
  grantedToUserId: string;
  grantedToName: string;
  grantedToRole: string;
  accessLevel: 'full' | 'read_only' | 'emergency_only';
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  reason?: string;
}

export interface DbAuditEvent {
  id: string; // UUIDv4
  timestamp: string; // ISO 8601 UTC
  action: string;
  userId: string;
  userRole: string;
  userName: string;
  targetResource?: string;
  targetPatientId?: string;
  details?: string;
  ipAddress?: string;
  sessionId?: string;
  outcome: 'success' | 'failure' | 'denied';
  sha256Signature?: string; // Tamper-evident digest
}
