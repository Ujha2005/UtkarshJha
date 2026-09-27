# CAREGRAPH — Backend Architecture & Service Boundary

> **Notice**:
> - `[IMPLEMENTED]`: Clean backend boundary abstraction in `src/services/api/` (`backendProvider.ts`, `apiClient.ts`, `mockBackend.ts`, `errors.ts`, `mappers/fhirMapper.ts`).
> - `[ARCHITECTURAL FOUNDATION]`: Typed API Error models, unified ApiClient with namespaced operations, environment mode detection (`src/config/environment.ts`), and bidirectional FHIR mapping.
> - `[REQUIRES PRODUCTION BACKEND]`: Deployed REST/GraphQL/gRPC microservices, persistent relational database, OAuth2/OIDC identity provider, and hardware security modules.

---

## 1. High-Level System Architecture

CAREGRAPH is designed with an explicit service boundary that cleanly separates presentation layers from data providers:

```
[Presentation Layer (React 19 + TypeScript)]
      │
      ▼
[PatientRecordContext]
      │
      ▼
[ApiClient (src/services/api/apiClient.ts)]
      │
      ├── Mode: 'demo' (Active) ────────► [MockBackendProvider] ──► In-Memory Demo Dataset
      │                                       (p1 / Rajesh Kumar Sharma)
      │
      └── Mode: 'production' (Roadmap) ──► [HttpBackendProvider] ─► Secure REST / FHIR Gateway
                                                                        │
                                                                        ├── PostgreSQL (Relational)
                                                                        ├── S3 (Encrypted Documents)
                                                                        └── OIDC / Keycloak (Identity)
```

---

## 2. API Namespaces & Endpoints [IMPLEMENTED IN CLIENT]

The client organizes all operations under dedicated namespaces:

### 2.1 `apiClient.auth`
- `login(credentials)`: Authenticates against provider, returns `User` profile.
- `logout(sessionId)`: Invalidates session tokens and records `LOGOUT` audit event.
- `verifySession(sessionId)`: Health check for session freshness.

### 2.2 `apiClient.patient`
- `get(patientId)`: Fetches demographic and contact profile.
- `getRecords(patientId)`: Retrieves complete longitudinal bundle (`PatientRecordBundle`).
- `resetToBaseline(patientId)`: Restores pristine synthetic baseline in demo mode.

### 2.3 `apiClient.records`
- `getConditions(patientId)`: Retrieves active and historical diagnoses.
- `getMedications(patientId)`: Retrieves current regimen and discontinued medications.
- `getLabTrends(patientId)`: Retrieves time-series biomarker trends (HbA1c, Creatinine, BP, etc.).
- `getReports(patientId)`: Retrieves full clinical diagnostic reports.
- `getHealthEvents(patientId)`: Retrieves timeline event log.
- `getNutritionEntries(patientId)`: Retrieves dietary logs and macronutrient totals.
- `getDoctors()`: Retrieves accredited clinical providers.
- `getAllergies(patientId)`: Retrieves adverse reactions and documented allergies.
- `getHealthGraph(patientId)`: Retrieves computed nodes and links for force-directed relationship graph.

### 2.4 `apiClient.documents`
- `list(patientId)`: Retrieves uploaded documents and extraction status.
- `upload(patientId, document)`: Uploads new medical document.
- `updateEntityStatus(docId, entityId, status)`: Sets review status (`user_confirmed`, `clinician_verified`, `rejected`).
- `editEntity(docId, entityId, changes)`: Modifies extracted candidate data.
- `commitAcceptedEntities(docId)`: Merges verified entities into primary longitudinal store.

### 2.5 `apiClient.consent`
- `getGrants(patientId)`: Lists active provider and caregiver access grants.
- `grantAccess(grant)`: Issues new clinical access authorization.
- `revokeAccess(grantId)`: Revokes existing authorization.
- `getConsents(patientId)`: Lists 5 dynamic patient consent directives.
- `updateConsent(consentId, status)`: Toggles consent state (`granted` vs `revoked`).

### 2.6 `apiClient.audit`
- `getLogs(filters)`: Retrieves filtered audit trail entries.
- `logEvent(event)`: Emits new audit event.

---

## 3. Data Flow Comparison: Demo vs. Production

| Feature | Current Demo Architecture | Production Target Architecture |
|---|---|---|
| **Data Provider** | `MockBackendProvider` (Local memory) | `HttpBackendProvider` (FastAPI / NestJS) |
| **Persistence** | Volatile in-memory (resets on reload) | PostgreSQL 16 + TimescaleDB |
| **Authentication** | In-memory demo credentials (`demo123`) | OAuth 2.0 + OpenID Connect (Keycloak / Auth0) |
| **Session State** | In-memory (30-min timer) | HttpOnly, Secure, SameSite=Strict cookies + Redis |
| **Document Storage**| In-memory base64 strings | AWS S3 with KMS Customer-Managed Keys |
| **Audit Logging** | 1000-entry in-memory ring buffer | Append-only streaming to AWS CloudTrail / Datadog |
| **Interoperability**| Client-side FHIR mapper functions | Live FHIR R4 REST Server + SMART on FHIR |
