# CAREGRAPH Security Architecture

**DISCLAIMER: This is a demonstration platform. It does NOT provide legal compliance with HIPAA, GDPR, DPDP Act, or any other regulatory framework. All data is synthetic and resides strictly in memory for demonstration purposes.**

## Overview
CAREGRAPH is designed with a security-first mindset, modeling how a modern, secure Electronic Health Record (EHR) system should operate. In this Phase 8 release, the application acts as a client-side only demonstration that explicitly distinguishes between its current demo state and the necessary requirements for a production-grade medical application.

## Authentication Model (Demo vs Production)
- **Demo Mode**: The application uses mock authentication mechanisms to simulate user login. Credentials are not stored persistently, and session state is maintained solely in React state.
- **Production Mode**: A production deployment requires a robust Identity Provider (IdP) supporting OpenID Connect (OIDC) or OAuth 2.0 (e.g., Auth0, Okta, or a custom IdentityServer). 

## Role-Based Access Control (RBAC)
CAREGRAPH implements strict RBAC with the following primary roles:
- **PATIENT**: Can view their own records, manage consent, and grant access to caregivers or doctors.
- **DOCTOR**: Can view records of patients who have granted them access, add clinical notes, and prescribe medications.
- **CAREGIVER**: Can view specific sections of a patient's record based on granular access grants.
- **ADMIN**: Has systemic oversight, can view audit logs, and manage system configurations (cannot view clinical data without explicit break-glass consent).

## Session Management Approach
Sessions in the demo are ephemeral. In a production environment:
- Secure, HttpOnly, SameSite cookies must be used to store refresh tokens.
- Short-lived JWT access tokens should be used for API requests.
- Absolute session timeouts and idle timeouts must be strictly enforced (e.g., 15-minute idle timeout).

## Data Protection Principles
- **Least Privilege**: Users only see what their role and active grants permit.
- **Encryption**: Production architectures must encrypt data at rest (AES-256) and in transit (TLS 1.2+).
- **Anonymization**: All AI/LLM requests in production must strip Personally Identifiable Information (PII) before transmission.

## Client-Side Only Architecture Limitations
Currently, all logic runs in the browser. This means:
1. "Security" is purely UI-enforced. A user with developer tools could bypass UI restrictions.
2. Data is not persisted across browser refreshes unless mocked in local storage.
3. True security requires a Backend-for-Frontend (BFF) or a traditional API gateway to enforce authorization rules server-side.

## Implemented vs Needed for Production
### Implemented (Demo)
- UI-based RBAC simulation
- Mock audit logging of user actions
- Simulated access grants and consent revocations
- Synthetic data generation

### Needed for Production
- Server-side authorization enforcement
- Persistent, encrypted database
- Hardware Security Modules (HSM) for key management
- Comprehensive penetration testing and compliance audits
