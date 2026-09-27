import { auditLog } from './auditLog';

export interface AccessGrant {
  id: string;
  grantedTo: { userId: string; name: string; role: string };
  grantedBy: { userId: string; name: string };
  patientId: string;
  accessLevel: 'full' | 'read_only' | 'emergency_only';
  grantedAt: string;
  expiresAt?: string;
  isActive: boolean;
  reason?: string;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  consentType: 'data_sharing' | 'research_participation' | 'ai_analysis' | 'emergency_access' | 'caregiver_access';
  status: 'granted' | 'revoked' | 'expired';
  grantedAt: string;
  revokedAt?: string;
  description: string;
}

// In production, this requires legal-grade consent tracking with immutable audit trail and verifiable signatures
class ConsentService {
  private grants: AccessGrant[] = [];
  private consents: ConsentRecord[] = [];

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // Pre-populate with realistic demo data for Rajesh Kumar Sharma (p1)
    this.grants = [
      {
        id: 'grant-1',
        grantedTo: { userId: 'u2', name: 'Dr. Rajan Mehta', role: 'Doctor (PCP)' },
        grantedBy: { userId: 'u1', name: 'Rajesh Kumar Sharma' },
        patientId: 'p1',
        accessLevel: 'full',
        grantedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        reason: 'Primary Care Physician — Longitudinal Clinical Care'
      },
      {
        id: 'grant-2',
        grantedTo: { userId: 'u3', name: 'Anita Sharma', role: 'Caregiver / Family' },
        grantedBy: { userId: 'u1', name: 'Rajesh Kumar Sharma' },
        patientId: 'p1',
        accessLevel: 'read_only',
        grantedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        reason: 'Authorized Family Caregiver — Senior Support'
      },
      {
        id: 'grant-3',
        grantedTo: { userId: 'emergency-svc', name: 'Emergency Medical Services', role: 'Emergency' },
        grantedBy: { userId: 'u1', name: 'Rajesh Kumar Sharma' },
        patientId: 'p1',
        accessLevel: 'emergency_only',
        grantedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        reason: 'Emergency Break-Glass Access'
      }
    ];

    this.consents = [
      {
        id: 'consent-1',
        patientId: 'p1',
        consentType: 'data_sharing',
        status: 'granted',
        grantedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Allow authorized healthcare providers and specialists across the network to access health records.'
      },
      {
        id: 'consent-2',
        patientId: 'p1',
        consentType: 'research_participation',
        status: 'revoked',
        grantedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Allow anonymized health data to be included in observational medical research cohorts.'
      },
      {
        id: 'consent-3',
        patientId: 'p1',
        consentType: 'ai_analysis',
        status: 'granted',
        grantedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Allow client-side and secure backend AI algorithms to assist in document extraction and longitudinal summarization.'
      },
      {
        id: 'consent-4',
        patientId: 'p1',
        consentType: 'emergency_access',
        status: 'granted',
        grantedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Allow accredited emergency responders to access allergies, active medications, and vital diagnoses during life-threatening emergencies.'
      },
      {
        id: 'consent-5',
        patientId: 'p1',
        consentType: 'caregiver_access',
        status: 'granted',
        grantedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Authorize designated family caregiver to view medication schedules, upcoming appointments, and daily wellness logs.'
      }
    ];
  }

  public getAccessGrants(patientId: string = 'p1'): AccessGrant[] {
    return this.grants.filter(g => g.patientId === patientId || g.patientId === 'pat-1');
  }

  public grantAccess(grant: Omit<AccessGrant, 'id' | 'grantedAt' | 'isActive'>): AccessGrant {
    const newGrant: AccessGrant = {
      ...grant,
      id: `grant-${crypto.randomUUID()}`,
      grantedAt: new Date().toISOString(),
      isActive: true
    };
    this.grants.unshift(newGrant);

    // Audit log this action
    auditLog.logAuditEvent({
      action: 'CONSENT_GRANT',
      userId: grant.grantedBy.userId,
      userRole: 'PATIENT',
      userName: grant.grantedBy.name,
      targetResource: `AccessGrant/${newGrant.id}`,
      targetPatientId: grant.patientId,
      outcome: 'success',
      details: `Granted ${grant.accessLevel} access to ${grant.grantedTo.name} (${grant.grantedTo.role})`
    });

    return newGrant;
  }

  public revokeAccess(grantId: string, revokedByUserId: string = 'u1', revokedByName: string = 'Rajesh Kumar Sharma'): void {
    const grant = this.grants.find(g => g.id === grantId);
    if (grant) {
      grant.isActive = false;
      grant.expiresAt = new Date().toISOString();

      // Audit log revocation
      auditLog.logAuditEvent({
        action: 'CONSENT_REVOKE',
        userId: revokedByUserId,
        userRole: 'PATIENT',
        userName: revokedByName,
        targetResource: `AccessGrant/${grantId}`,
        targetPatientId: grant.patientId,
        outcome: 'success',
        details: `Revoked access for ${grant.grantedTo.name}`
      });
    }
  }

  public getConsentRecords(patientId: string = 'p1'): ConsentRecord[] {
    return this.consents.filter(c => c.patientId === patientId || c.patientId === 'pat-1');
  }

  public updateConsent(
    consentId: string, 
    status: 'granted' | 'revoked' | 'expired',
    updatedByUserId: string = 'u1',
    updatedByName: string = 'Rajesh Kumar Sharma'
  ): void {
    const consent = this.consents.find(c => c.id === consentId);
    if (consent) {
      consent.status = status;
      if (status === 'revoked') {
        consent.revokedAt = new Date().toISOString();
      } else if (status === 'granted') {
        consent.grantedAt = new Date().toISOString();
        consent.revokedAt = undefined;
      }

      auditLog.logAuditEvent({
        action: status === 'granted' ? 'CONSENT_GRANT' : 'CONSENT_REVOKE',
        userId: updatedByUserId,
        userRole: 'PATIENT',
        userName: updatedByName,
        targetResource: `Consent/${consent.consentType}`,
        targetPatientId: consent.patientId,
        outcome: 'success',
        details: `${status === 'granted' ? 'Granted' : 'Revoked'} consent for ${consent.consentType}`
      });
    }
  }
}

export const consentService = new ConsentService();
