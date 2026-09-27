# Audit Logging

## Overview
Comprehensive audit logging is a cornerstone of medical application security. It ensures accountability, aids in forensic investigations, and is a hard requirement for regulatory frameworks like HIPAA.

## Audit Event Types
The system tracks the following core event categories:
- `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILURE`
- `AUTH_LOGOUT`
- `RECORD_VIEWED`
- `RECORD_CREATED`
- `RECORD_UPDATED`
- `RECORD_DELETED`
- `ACCESS_GRANTED`
- `ACCESS_REVOKED`
- `EMERGENCY_ACCESS_INVOKED`
- `DOCUMENT_DOWNLOADED`

## AuditEntry Structure
A standard audit entry contains:
```json
{
  "id": "uuid",
  "timestamp": "2026-09-27T10:00:00Z",
  "actorId": "user_123",
  "actorRole": "DOCTOR",
  "action": "RECORD_VIEWED",
  "resourceType": "Patient",
  "resourceId": "patient_456",
  "ipAddress": "192.168.1.1",
  "metadata": {
    "reason": "Routine checkup",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## What Gets Logged and When
- **Every Read**: Viewing a patient's profile or opening a document triggers a `RECORD_VIEWED` event.
- **Every Write**: Any mutation (add, edit, delete) triggers a corresponding update event.
- **Auth Events**: All login attempts, whether successful or failed, are logged to detect brute-force activity.

## Retention Policy (Production Recommendations)
- **Active Storage**: Keep 1 year of logs in hot, easily queryable storage (e.g., indexed PostgreSQL or Elasticsearch).
- **Cold Storage**: Archive logs older than 1 year to immutable blob storage (e.g., AWS S3 Glacier with Object Lock).
- **Total Retention**: Maintain logs for a minimum of 7-10 years, depending on local jurisdiction requirements.

## Admin Audit Log Viewer
In the CAREGRAPH demo, Admins have access to a simulated Audit Log Viewer UI. This allows them to filter logs by actor, action type, and date range.

## Production Integration
- **SIEM Integration**: Audit logs should be forwarded in real-time to a Security Information and Event Management (SIEM) system (e.g., Splunk, Datadog) using secure syslog or an agent.
- **Immutable Logs**: Ensure the database storing audit logs is append-only. Users, including DBAs, should not have permissions to `UPDATE` or `DELETE` rows in the audit table.
