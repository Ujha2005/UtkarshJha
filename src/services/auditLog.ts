export type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'PATIENT_RECORD_VIEW' | 'PATIENT_RECORD_SEARCH'
  | 'DOCUMENT_UPLOAD' | 'DOCUMENT_REVIEW' | 'DOCUMENT_COMMIT'
  | 'ENTITY_ACCEPT' | 'ENTITY_REJECT' | 'ENTITY_EDIT'
  | 'REPORT_VIEW' | 'REPORT_EXPORT'
  | 'MEDICATION_VIEW' | 'MEDICATION_CHANGE'
  | 'LAB_TREND_VIEW'
  | 'SYMPTOM_EVALUATION'
  | 'DATA_EXPORT' | 'PDF_GENERATE'
  | 'CONSENT_GRANT' | 'CONSENT_REVOKE'
  | 'ACCESS_DENIED' | 'SESSION_EXPIRED'
  | 'PATIENT_DATA_RESET' | 'MODE_SWITCH';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userRole: string;
  userName: string;
  targetResource?: string;
  targetPatientId?: string;
  details?: string;
  ipAddress?: string;
  sessionId?: string;
  outcome: 'success' | 'failure' | 'denied';
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  outcome?: 'success' | 'failure' | 'denied';
  targetPatientId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

class AuditLogService {
  private logs: AuditEntry[] = [];
  private readonly MAX_LOGS = 1000;

  constructor() {
    this.seedDemoLogs();
  }

  public seedDemoLogs() {
    if (this.logs.length > 0) return;

    const now = Date.now();
    const demoEntries: Omit<AuditEntry, 'id'>[] = [
      {
        timestamp: new Date(now - 1000 * 60 * 8).toISOString(),
        action: 'LOGIN',
        userId: 'u2',
        userRole: 'DOCTOR',
        userName: 'Dr. Rajan Mehta',
        targetResource: 'Auth/Session',
        details: 'Physician authenticated via demo credentials',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
        action: 'PATIENT_RECORD_VIEW',
        userId: 'u2',
        userRole: 'DOCTOR',
        userName: 'Dr. Rajan Mehta',
        targetResource: 'Patient/p1',
        targetPatientId: 'p1',
        details: 'Accessed longitudinal record for Rajesh Kumar Sharma',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 42).toISOString(),
        action: 'LOGIN_FAILED',
        userId: 'unknown',
        userRole: 'ANONYMOUS',
        userName: 'external_guest',
        targetResource: 'Auth/Login',
        details: 'Failed authentication attempt: invalid credentials',
        outcome: 'failure',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        action: 'REPORT_VIEW',
        userId: 'u2',
        userRole: 'DOCTOR',
        userName: 'Dr. Rajan Mehta',
        targetResource: 'Report/rpt-1',
        targetPatientId: 'p1',
        details: 'Viewed Comprehensive Metabolic Panel (Nephrology Clinic)',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
        action: 'LAB_TREND_VIEW',
        userId: 'u2',
        userRole: 'DOCTOR',
        userName: 'Dr. Rajan Mehta',
        targetResource: 'LabTrends/HbA1c',
        targetPatientId: 'p1',
        details: 'Analyzed 7-year longitudinal HbA1c trajectory (2019-2026)',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
        action: 'MEDICATION_VIEW',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: 'Rajesh Kumar Sharma',
        targetResource: 'Medications/List',
        targetPatientId: 'p1',
        details: 'Patient reviewed active prescription regimen',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        action: 'ACCESS_DENIED',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: 'Rajesh Kumar Sharma',
        targetResource: 'System/AuditLog',
        details: 'Unauthorized attempt to access system administrative audit logs',
        outcome: 'denied',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
        action: 'DOCUMENT_UPLOAD',
        userId: 'u2',
        userRole: 'DOCTOR',
        userName: 'Dr. Rajan Mehta',
        targetResource: 'DocumentIngest/CMP-2026',
        targetPatientId: 'p1',
        details: 'Uploaded synthetic lab report for clinical entity extraction',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        action: 'PDF_GENERATE',
        userId: 'u2',
        userRole: 'DOCTOR',
        userName: 'Dr. Rajan Mehta',
        targetResource: 'DoctorSummary/PDF',
        targetPatientId: 'p1',
        details: 'Exported structured Doctor Summary Object PDF',
        outcome: 'success',
      },
      {
        timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
        action: 'CONSENT_GRANT',
        userId: 'u1',
        userRole: 'PATIENT',
        userName: 'Rajesh Kumar Sharma',
        targetResource: 'Consent/EmergencyAccess',
        targetPatientId: 'p1',
        details: 'Granted emergency responder access privilege',
        outcome: 'success',
      },
    ];

    this.logs = demoEntries.map(e => ({
      ...e,
      id: crypto.randomUUID(),
    }));
  }

  // In production, this would send audit logs to a secure, append-only SIEM or database
  public logAuditEvent(event: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const entry: AuditEntry = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    // Add to front of ring buffer
    this.logs.unshift(entry);
    
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    return entry;
  }

  public getAuditLog(filters?: AuditFilter): AuditEntry[] {
    if (!filters) return [...this.logs];
    
    return this.logs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.outcome && log.outcome !== filters.outcome) return false;
      if (filters.targetPatientId && log.targetPatientId !== filters.targetPatientId) return false;
      
      if (filters.startDate) {
        if (new Date(log.timestamp) < new Date(filters.startDate)) return false;
      }
      if (filters.endDate) {
        if (new Date(log.timestamp) > new Date(filters.endDate)) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = 
          log.userName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.targetResource && log.targetResource.toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q));
        if (!match) return false;
      }
      
      return true;
    });
  }

  public clearAuditLog() {
    this.logs = [];
  }

  public getAuditStats() {
    const totalEvents = this.logs.length;
    const byAction: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    let successCount = 0;
    let failureCount = 0;
    let deniedCount = 0;

    this.logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byUser[log.userName] = (byUser[log.userName] || 0) + 1;
      if (log.outcome === 'success') successCount++;
      else if (log.outcome === 'failure') failureCount++;
      else if (log.outcome === 'denied') deniedCount++;
    });

    return { totalEvents, byAction, byUser, successCount, failureCount, deniedCount };
  }
}

export const auditLog = new AuditLogService();
