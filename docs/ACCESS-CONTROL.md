# Access Control Model

## Overview
CAREGRAPH utilizes a strict Role-Based Access Control (RBAC) model combined with Context-Aware access policies to ensure data is only accessible to authorized individuals.

## Role Definitions and Permissions Matrix

| Resource | PATIENT | DOCTOR | CAREGIVER | ADMIN |
|---|---|---|---|---|
| **Own Record** | Read/Update | N/A | N/A | N/A |
| **Patient Records** | N/A | Read/Update* | Read* | N/A |
| **Prescriptions** | Read | Read/Create* | Read* | N/A |
| **Audit Logs** | Read (Self) | Read (Own Actions) | N/A | Read (All) |
| **System Config** | N/A | N/A | N/A | Read/Update |

*\* Requires an active `AccessGrant` from the Patient.*

## AccessGrant Model
The `AccessGrant` model is the core of patient-controlled data sharing.
- **Grant**: A patient explicitly grants access to a specific doctor or caregiver.
- **Revoke**: A patient can revoke access at any time, instantly severing the connection.
- **Expire**: Grants can be configured to expire automatically (e.g., 24 hours, 30 days).

## Patient Self-Service Access Management
Patients have a dedicated "Access Management" dashboard where they can:
1. View all active and expired grants.
2. Generate temporary, time-bound access links.
3. Audit who has viewed their record and when.

## Caregiver Access Model
Caregivers (family members, home aides) often need access to a subset of data (e.g., medication schedules, upcoming appointments) without needing full clinical notes. The `AccessGrant` for a caregiver includes a scoped permissions object restricting their view.

## Emergency Access Provisions (Break-Glass)
In critical situations where a patient is unresponsive, clinicians can utilize "Break-Glass" access:
1. The clinician declares an emergency.
2. Full access is temporarily granted.
3. The system logs a high-priority `EMERGENCY_ACCESS` audit event.
4. Admins and the Patient (or proxy) are immediately notified via email/SMS.
5. The access requires retrospective justification and review by the hospital's privacy officer.
