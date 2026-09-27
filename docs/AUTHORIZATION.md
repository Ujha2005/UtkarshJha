# CAREGRAPH — Server-Side Authorization & RBAC Architecture

> **Notice**:
> - `[IMPLEMENTED]`: UI RoleGuard component (`src/auth/RoleGuard.tsx`), route guards (`src/auth/ProtectedRoute.tsx`), role-based mode access, and typed API error handlers.
> - `[ARCHITECTURAL FOUNDATION]`: Typed API error classes (`UnauthorizedError`, `ForbiddenError`, `NotFoundError`) in `src/services/api/errors.ts`.
> - `[REQUIRES PRODUCTION BACKEND]`: Cryptographic JWT validation, server-side ABAC/RBAC middleware, and hardware-backed session checks.

---

## 1. Principles of Healthcare Authorization

In clinical applications, **presentation-layer guards (such as React's RoleGuard) are strictly for UX facilitation**. True security and data protection must be unconditionally enforced at the server boundary:

1. **Defense in Depth**: Every API request evaluates identity, role, patient context, and explicit consent grants before returning medical data.
2. **Principle of Least Privilege**: Users access only the minimum data required for their clinical or personal role.
3. **Auditability**: Every authorized view and every unauthorized attempt triggers an immutable audit log entry.

---

## 2. Role Permissions Matrix [IMPLEMENTED IN DEMO / SPECIFIED FOR PRODUCTION]

| Resource / Action | PATIENT | DOCTOR | CAREGIVER | ADMIN |
|---|:---:|:---:|:---:|:---:|
| **View Own Record** | ✅ Full | N/A | N/A | ❌ |
| **View Assigned Patient Record** | N/A | ✅ (Requires Grant) | ✅ (Requires Grant) | ❌ |
| **Manage Access Grants** | ✅ Full | ❌ | ❌ (Unless Proxy) | ❌ |
| **Manage Consent Directives** | ✅ Full | ❌ | ❌ (Unless Proxy) | ❌ |
| **Upload Clinical Documents** | ✅ Own | ✅ Assigned | ❌ | ❌ |
| **Review & Commit Extracted Entities**| ✅ Own | ✅ Clinical Verify | ❌ | ❌ |
| **Export Health Record (JSON/FHIR)** | ✅ Own | ❌ | ❌ | ❌ |
| **View System Audit Logs** | ❌ (Own only) | ❌ | ❌ | ✅ Full |
| **Purge / Reset Demo Data** | ✅ (Demo only) | ✅ (Demo only) | ❌ | ✅ Full |

---

## 3. Server-Side HTTP Status Code Semantics [ARCHITECTURAL FOUNDATION]

CAREGRAPH enforces strict semantics for authorization failures:

### 3.1 `401 Unauthorized` (`UnauthorizedError`)
- **Condition**: The client has not provided credentials, the session token is expired, or the signature is invalid.
- **Client Action**: Automatic redirection to `/login` with redirect intent saved.
- **Example**:
  ```json
  {
    "statusCode": 401,
    "errorCode": "UNAUTHORIZED",
    "message": "Authentication required. Valid credentials or session token missing.",
    "timestamp": "2026-09-27T13:20:00.000Z"
  }
  ```

### 3.2 `403 Forbidden` (`ForbiddenError`)
- **Condition**: The user is authenticated, but their role or consent grants do not permit access to the requested patient record or administrative endpoint.
- **Example Scenario**: A user logged in as `patient.demo` attempting to fetch `/api/audit` or another patient's records (`p2`).
- **Audit Action**: Logged immediately with `outcome: "denied"` and action `ACCESS_DENIED`.
- **Example**:
  ```json
  {
    "statusCode": 403,
    "errorCode": "FORBIDDEN",
    "message": "Access denied. You do not have permission to access this resource or patient record.",
    "timestamp": "2026-09-27T13:20:00.000Z"
  }
  ```

### 3.3 `404 Not Found` (`NotFoundError`)
- **Condition**: The requested entity does not exist, or the user is not permitted to know of its existence (prevention of resource enumeration attacks).
- **Example**: Requesting a non-existent document ID or patient record.
- **Example**:
  ```json
  {
    "statusCode": 404,
    "errorCode": "NOT_FOUND",
    "message": "Patient with ID \"p999\" was not found.",
    "timestamp": "2026-09-27T13:20:00.000Z"
  }
  ```

---

## 4. Break-Glass Emergency Access Model [ARCHITECTURAL FOUNDATION]

In acute clinical situations (e.g. unconscious trauma admission), certified emergency practitioners can activate **Break-Glass Emergency Protocol**:
1. Generates an elevated temporary authorization grant.
2. Restricts view to critical allergies, active medications, and acute conditions.
3. Automatically dispatches notification to the patient / proxy.
4. Generates an indelible audit entry flagged for administrative review.
