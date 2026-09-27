# CAREGRAPH — Database Domain Model & Schema Architecture

> **Notice**: This document outlines the relational/document schema architecture for CAREGRAPH. Items are explicitly marked with implementation status:
> - `[IMPLEMENTED]`: Active in current application code
> - `[ARCHITECTURAL FOUNDATION]`: Abstract TypeScript interfaces and client domain models exist
> - `[REQUIRES PRODUCTION BACKEND]`: Requires physical cloud database hosting and DBA provisioning

---

## 1. Architectural Overview

CAREGRAPH models longitudinal health records through normalized relational entities with audit provenance. In Phase 9, client-side domain models in `src/services/api/apiTypes.ts` represent the exact schema expected by PostgreSQL / TimescaleDB in a production deployment.

```
+-------------------------------------------------------------+
|                          DbUser                             |
| id (PK), username, email, passwordHash, role, linkedPatient |
+-------------------------------------------------------------+
                               | 1
                               |
                               | 1
+-------------------------------------------------------------+
|                         DbPatient                           |
| id (PK), uhid, name, dob, gender, bloodGroup, primaryDoctor |
+-------------------------------------------------------------+
       | 1                   | 1                  | 1
       |                     |                    |
       | N                   | N                  | N
+--------------+      +---------------+    +-------------------+
| DbCondition  |      | DbMedication  |    | DbDiagnosticReport|
+--------------+      +---------------+    +-------------------+
                                                      | 1
                                                      |
                                                      | N
                                           +-------------------+
                                           |   DbObservation   |
                                           +-------------------+
```

---

## 2. Core Entities Schema

### 2.1 `DbEntityBase` [ARCHITECTURAL FOUNDATION]
Every stored database entity inherits standard audit columns:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
created_by UUID NOT NULL,
updated_by UUID,
version INT NOT NULL DEFAULT 1,
source_document_id UUID REFERENCES documents(id),
is_deleted BOOLEAN NOT NULL DEFAULT FALSE
```

### 2.2 `users` Table [REQUIRES PRODUCTION BACKEND]
Stores credential hashes and system role mappings:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Stable unique identifier |
| `username` | VARCHAR(64) | UNIQUE, NOT NULL | Account identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Verified contact email |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2id password hash |
| `role` | VARCHAR(16) | NOT NULL | `PATIENT`, `DOCTOR`, `CAREGIVER`, `ADMIN` |
| `linked_patient_id` | UUID | FK -> patients(id) | For patient self-service |
| `linked_practitioner_id` | UUID | FK -> practitioners(id) | For clinical provider |
| `is_active` | BOOLEAN | NOT NULL DEFAULT true | Revocation flag |
| `mfa_enabled` | BOOLEAN | NOT NULL DEFAULT false | Enforced for clinical roles |

*Current Demo Implementation*: In-memory `DEMO_ACCOUNTS` in `src/auth/authService.ts` [IMPLEMENTED].

### 2.3 `patients` Table [ARCHITECTURAL FOUNDATION]
Core longitudinal demographic record:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(32) | PK | e.g. `p1` or UUID |
| `uhid` | VARCHAR(64) | UNIQUE, NOT NULL | National / Institutional UHID |
| `name` | VARCHAR(255) | NOT NULL | Full official name |
| `date_of_birth` | DATE | NOT NULL | ISO 8601 date |
| `gender` | VARCHAR(16) | NOT NULL | `male`, `female`, `other` |
| `blood_group` | VARCHAR(8) | NOT NULL | e.g. `B+` |
| `phone` | VARCHAR(32) | NOT NULL | E.164 phone number |
| `email` | VARCHAR(255) | NOT NULL | Contact email |
| `emergency_contact` | JSONB | NOT NULL | `{ name, relationship, phone }` |
| `primary_doctor_id` | VARCHAR(32) | NOT NULL | Linked primary clinician |
| `insurance_id` | VARCHAR(64) | NULL | Coverage identifier |

### 2.4 `conditions` Table [ARCHITECTURAL FOUNDATION]
Longitudinal medical diagnoses:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(32) | PK | Stable identifier |
| `patient_id` | VARCHAR(32) | FK -> patients(id) | Subject reference |
| `name` | VARCHAR(255) | NOT NULL | Condition display name |
| `icd10_code` | VARCHAR(16) | NULL | Standardized ICD-10 code (e.g. `E11.9`) |
| `diagnosed_date` | DATE | NOT NULL | Diagnosis inception |
| `status` | VARCHAR(16) | NOT NULL | `active`, `managed`, `resolved` |
| `severity` | VARCHAR(16) | NOT NULL | `mild`, `moderate`, `severe` |
| `diagnosed_by_id` | VARCHAR(32) | NOT NULL | Diagnosing clinician |
| `notes` | TEXT | NULL | Clinical observations |

### 2.5 `medications` Table [ARCHITECTURAL FOUNDATION]
Active and historical pharmacotherapy:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(32) | PK | Stable identifier |
| `patient_id` | VARCHAR(32) | FK -> patients(id) | Subject reference |
| `name` | VARCHAR(255) | NOT NULL | Medication generic / brand name |
| `rxnorm_code` | VARCHAR(16) | NULL | Standardized RxNorm code |
| `dose` | VARCHAR(64) | NOT NULL | e.g. `500mg`, `10mg` |
| `frequency` | VARCHAR(64) | NOT NULL | e.g. `twice daily with meals` |
| `route` | VARCHAR(32) | NOT NULL | e.g. `Oral`, `Subcutaneous` |
| `start_date` | DATE | NOT NULL | Prescription start |
| `end_date` | DATE | NULL | Deprecation / discontinuation date |
| `prescribed_by_id` | VARCHAR(32) | NOT NULL | Prescribing physician |
| `related_condition_id` | VARCHAR(32) | NULL | Indication condition |
| `status` | VARCHAR(16) | NOT NULL | `active`, `discontinued`, `completed` |

### 2.6 `observations` Table (Lab Trends) [ARCHITECTURAL FOUNDATION]
Biomarker measurements stored as time-series metrics:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Unique observation identifier |
| `patient_id` | VARCHAR(32) | FK -> patients(id) | Subject reference |
| `report_id` | VARCHAR(32) | FK -> reports(id) | Source diagnostic report |
| `loinc_code` | VARCHAR(16) | NULL | Standardized LOINC code (e.g. `4548-4`) |
| `parameter` | VARCHAR(128) | NOT NULL | e.g. `HbA1c`, `Creatinine` |
| `value` | NUMERIC(10,3)| NOT NULL | Numeric magnitude |
| `unit` | VARCHAR(32) | NOT NULL | Units of measure (e.g. `%`, `mg/dL`) |
| `reference_min` | NUMERIC(10,3)| NULL | Lower reference boundary |
| `reference_max` | NUMERIC(10,3)| NULL | Upper reference boundary |
| `status` | VARCHAR(16) | NOT NULL | `normal`, `low`, `high`, `critical` |
| `observed_at` | TIMESTAMPTZ | NOT NULL | Specimen collection time |

---

## 3. Provenance & Audit Trail Architecture [IMPLEMENTED]

Every entity extracted through the Ingestion Hub retains bidirectional traceability:
- `source_document_id`: Links back to `documents(id)`
- `audit_events`: Records exact timestamp, actor ID, IP address, and cryptographic SHA-256 digest
- Soft-deletion preserves complete clinical history without data destruction
