# CAREGRAPH — Security Architecture & Production Boundary

> **DISCLAIMER**: CAREGRAPH is a healthcare technology demonstration and architecture framework using synthetic patient records. **It does NOT provide legal compliance with HIPAA, GDPR, or India's DPDP Act** without full deployment on production cloud infrastructure featuring certified hardware security modules, enterprise IdP, audited key management, and third-party penetration testing.

---

## 1. Security Tenets

1. **Explicit Trust Boundaries**: The browser client is an untrusted environment. All security, authentication, and authorization decisions must be validated at the backend boundary.
2. **Zero Storage of Credentials**: No credentials, passwords, or persistent authorization tokens are ever stored in `localStorage` or `sessionStorage`.
3. **Audit Trail Completeness**: Every clinical read, export, document upload, and consent modification emits an immutable, structured audit event.
4. **No Direct Third-Party LLM Calls**: AI inference operations are executed strictly behind an authenticated backend proxy to prevent client-side credential exposure and prompt injection.

---

## 2. Security Capabilities Comparison

| Security Capability | Status | Implementation Details |
|---|:---:|---|
| **Role-Based Access Control** | `[IMPLEMENTED]` | `RoleGuard` and `ProtectedRoute` enforce role separation (Patient, Doctor, Caregiver, Admin) in UI. |
| **Server-Side Authorization Rules**| `[ARCHITECTURAL FOUNDATION]` | Defined in `docs/AUTHORIZATION.md`. Client maps 401, 403, 404 with typed `ApiError` hierarchy. |
| **API Error Sanitization** | `[IMPLEMENTED]` | `ApiError` classes (`src/services/api/errors.ts`) sanitize messages; stack traces never leak to client. |
| **In-Memory Session Security** | `[IMPLEMENTED]` | Sessions stored in memory with 30-min auto-inactivity timeout and `SESSION_EXPIRED` audit logging. |
| **Audit Ledger Ring Buffer** | `[IMPLEMENTED]` | 1,000-entry in-memory ring buffer (`auditLog.ts`) logging 18 distinct security and clinical event types. |
| **Dynamic Consent Directives** | `[IMPLEMENTED]` | 5 toggleable patient directives (`consentService.ts`) with real-time audit event generation. |
| **Document Checksum & Provenance** | `[IMPLEMENTED]` | SHA-256 checksums and `sourceDocumentId` provenance links on all extracted entities. |
| **Document Storage Encryption** | `[REQUIRES PRODUCTION BACKEND]` | AWS KMS Customer-Managed Keys (SSE-KMS) with AES-256-GCM envelope encryption. |
| **OAuth 2.0 / OIDC with PKCE** | `[REQUIRES PRODUCTION BACKEND]` | Keycloak / Auth0 identity provider with HttpOnly, Secure, SameSite=Strict cookies. |
| **Immutable SIEM Logging** | `[REQUIRES PRODUCTION BACKEND]` | Append-only streaming to AWS CloudTrail / Datadog with tamper-evident HMAC signatures. |

---

## 3. Cryptographic Provenance & Transport Security

### 3.1 Data in Transit [REQUIRES PRODUCTION BACKEND]
- Enforced **TLS 1.3** across all public API routes with HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
- Mutual TLS (mTLS) for inter-service communication between API gateways and FHIR repository microservices.

### 3.2 Data at Rest [REQUIRES PRODUCTION BACKEND]
- Database tables (PostgreSQL) encrypted using **AES-256-XTS** via transparent data encryption.
- Highly sensitive fields (national identifiers, psychiatric notes) utilize application-layer field-level encryption with keys rotated annually via HashiCorp Vault.

### 3.3 Secure HTTP Response Headers [REQUIRES PRODUCTION BACKEND]
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.caregraph.health;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```
