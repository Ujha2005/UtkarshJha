# Data Architecture

## Overview
This document outlines the data architecture for CAREGRAPH, detailing the current demo-state models and the proposed production-grade relational database schema.

## Current Data Model (PatientRecordContext)
In the demo, all state is managed via React Context (`PatientRecordContext`). Data is maintained in-memory using deep cloning to prevent accidental state mutation.

### Entity Types
- **Patient**: Core demographic and identifying information.
- **Condition**: Chronic or acute medical conditions.
- **Medication**: Active and past prescriptions.
- **LabTrend**: Longitudinal data for vital signs and laboratory results.
- **Report**: Clinical notes, discharge summaries, and diagnostic reports.
- **HealthEvent**: Significant timeline events (e.g., surgeries, hospitalizations).
- **NutritionEntry**: Dietary and metabolic tracking data.

## Document Ingestion Pipeline
1. **Upload**: User uploads a PDF or image.
2. **Mock Processing**: (Demo) The system simulates OCR and NLP extraction.
3. **Data Mapping**: Extracted entities are mapped to internal types (Conditions, Medications).
4. **Verification**: A Doctor or Patient verifies the extracted data before it commits to the permanent record.

## State Management Approach
We utilize React Context combined with `useReducer` or standard immutable state updates. Deep cloning ensures that modifications during draft states do not leak into the committed global state until explicitly saved.

## Production Database Schema (Proposed Relational Model)

For production, a robust RDBMS (e.g., PostgreSQL) is recommended.

- **`users`**: id, email, password_hash, role, created_at, mfa_enabled
- **`patients`**: id, user_id, mrn, dob, demographics_jsonb
- **`conditions`**: id, patient_id, icd10_code, description, onset_date, status
- **`medications`**: id, patient_id, rxnorm_code, name, dosage, frequency, status
- **`lab_results`**: id, patient_id, loinc_code, test_name, value, unit, reference_range, recorded_at
- **`reports`**: id, patient_id, author_id, report_type, content, created_at
- **`documents`**: id, patient_id, file_path, mime_type, uploaded_at, status
- **`audit_log`**: id, user_id, action, resource_type, resource_id, ip_address, timestamp
- **`access_grants`**: id, patient_id, grantee_id, permissions_jsonb, expires_at, status
- **`consent_records`**: id, patient_id, policy_version, agreed_at, ip_address

## Data Flow Diagrams
```mermaid
flowchart TD
    Client[Browser App] --> API[API Gateway / BFF]
    API --> Auth[Auth Service]
    API --> EHR[EHR Core Service]
    EHR --> DB[(PostgreSQL)]
    EHR --> Audit[(Audit Log DB)]
    EHR --> S3[Blob Storage (Docs)]
```

## FHIR/HL7 Compatibility Notes
To ensure interoperability:
- Entities should be mapped to FHIR R4 resources (e.g., `Patient`, `Condition`, `MedicationRequest`, `Observation`).
- The API layer should expose standard FHIR endpoints where possible.
- Ingestion pipelines should support HL7 v2 ADT/ORU messages via a robust integration engine (e.g., Mirth Connect) before mutating the core database.
