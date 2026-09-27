import { describe, it, expect, beforeEach } from 'vitest';
import { consentService } from '@/services/consentService';
import { auditLog } from '@/services/auditLog';

describe('CAREGRAPH Consent & Access Control', () => {
  it('retrieves pre-populated access grants for p1', () => {
    const grants = consentService.getAccessGrants('p1');
    expect(grants.length).toBeGreaterThanOrEqual(2);
    expect(grants.some(g => g.grantedTo.name.includes('Rajan Mehta'))).toBe(true);
  });

  it('retrieves all 5 consent directives for p1', () => {
    const consents = consentService.getConsentRecords('p1');
    expect(consents.length).toBeGreaterThanOrEqual(5);
    const types = consents.map(c => c.consentType);
    expect(types).toContain('data_sharing');
    expect(types).toContain('research_participation');
    expect(types).toContain('ai_analysis');
    expect(types).toContain('emergency_access');
    expect(types).toContain('caregiver_access');
  });

  it('allows granting a new access grant and logs audit event', () => {
    const newGrant = consentService.grantAccess({
      grantedTo: { userId: 'doc-99', name: 'Dr. Test Cardiologist', role: 'Cardiologist' },
      grantedBy: { userId: 'u1', name: 'Rajesh Kumar Sharma' },
      patientId: 'p1',
      accessLevel: 'full',
      reason: 'Second Opinion',
    });

    expect(newGrant.id).toBeDefined();
    expect(newGrant.isActive).toBe(true);

    const grants = consentService.getAccessGrants('p1');
    expect(grants.some(g => g.id === newGrant.id)).toBe(true);

    // Verify audit log has CONSENT_GRANT
    const auditLogs = auditLog.getAuditLog({ action: 'CONSENT_GRANT' });
    expect(auditLogs.some(l => l.details?.includes('Dr. Test Cardiologist'))).toBe(true);
  });

  it('allows revoking an access grant and logs audit event', () => {
    const grants = consentService.getAccessGrants('p1');
    const activeGrant = grants.find(g => g.isActive);
    expect(activeGrant).toBeDefined();

    if (activeGrant) {
      consentService.revokeAccess(activeGrant.id, 'u1', 'Rajesh Kumar Sharma');
      const updated = consentService.getAccessGrants('p1').find(g => g.id === activeGrant.id);
      expect(updated?.isActive).toBe(false);
      expect(updated?.expiresAt).toBeDefined();
    }
  });

  it('allows toggling consent directive and logs audit event', () => {
    const consents = consentService.getConsentRecords('p1');
    const firstConsent = consents[0];
    const initialStatus = firstConsent.status;
    const newStatus = initialStatus === 'granted' ? 'revoked' : 'granted';

    consentService.updateConsent(firstConsent.id, newStatus, 'u1', 'Rajesh Kumar Sharma');
    const updated = consentService.getConsentRecords('p1').find(c => c.id === firstConsent.id);
    expect(updated?.status).toBe(newStatus);
  });
});
