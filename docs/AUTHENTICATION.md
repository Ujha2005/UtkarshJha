# CAREGRAPH — Authentication & Identity Architecture

> **Notice**:
> - `[IMPLEMENTED]`: `IAuthService` interface (`src/auth/authTypes.ts`), `DemoAuthService` (`src/auth/authService.ts`), `AuthProvider` React context with auto-session timer (`src/auth/AuthProvider.tsx`), `ProtectedRoute` (`src/auth/ProtectedRoute.tsx`), and `LoginPage` (`src/auth/LoginPage.tsx`).
> - `[ARCHITECTURAL FOUNDATION]`: Abstract auth provider decoupling, zero storage in `localStorage`, and session expiry audit logging.
> - `[REQUIRES PRODUCTION BACKEND]`: Enterprise OAuth 2.0 / OpenID Connect (OIDC) identity provider, FIDO2/WebAuthn Multi-Factor Authentication, and HttpOnly session cookies.

---

## 1. Demo Credentials Dictionary [IMPLEMENTED]

For evaluation and demonstration purposes, the following synthetic accounts are preconfigured:

| Persona | Role | Username | Password | Linked Identity | Purpose |
|---|---|---|---|---|---|
| **Patient** | `PATIENT` | `patient.demo` | `demo123` | Rajesh Kumar Sharma (`p1`) | Patient self-service, consent toggles, record export |
| **Doctor** | `DOCTOR` | `doctor.demo` | `demo123` | Dr. Rajan Mehta (`d4`) | Clinical review, clinical summary PDF export, doctor mode |
| **Caregiver** | `CAREGIVER` | `caregiver.demo` | `demo123` | Aarti Sharma | Assisted senior schedule review, caregiver access |
| **Admin** | `ADMIN` | `admin.demo` | `demo123` | System Administrator | System audit log review, security monitoring |

*Note: In demo mode, these accounts are evaluated in-memory. No credentials or passwords ever touch remote servers or persistent storage.*

---

## 2. Authentication Flow Architecture

```
Demo Flow [IMPLEMENTED]:
[User Input] ──► [LoginPage.tsx] ──► [authService.authenticateUser] ──► [AuthProvider Context] ──► [In-Memory Session]
                                                                                │
                                                                                └──► [Audit Log: LOGIN event]

Production Target [REQUIRES PRODUCTION BACKEND]:
[User Input] ──► [OIDC / OAuth 2.0 PKCE] ──► [MFA Challenge (TOTP/FIDO2)] ──► [IdP Issues Token]
                      │
                      ▼
        [Backend Sets HttpOnly Cookie] ──► [FastAPI / NestJS Validates JWT] ──► [Protected FHIR Endpoints]
```

---

## 3. Pluggable `IAuthService` Interface [IMPLEMENTED]

In Phase 9, authentication is decoupled behind the `IAuthService` interface:

```ts
export interface IAuthService {
  authenticateUser(credentials: LoginCredentials): Promise<User | null> | User | null;
  createSession(user: User): AuthSession;
  isSessionExpired(session: AuthSession | null): boolean;
  getDemoAccounts(): { id: string; username: string; displayName: string; role: UserRole }[];
}
```

This interface enables hot-swapping `DemoAuthService` with an `OidcAuthService` without modifying UI pages or route guards.

---

## 4. Session Security & Memory Isolation [IMPLEMENTED]

1. **Zero Persistent Storage of Tokens**: Credentials and session tokens are **NEVER stored in `localStorage` or `sessionStorage`**, eliminating token theft via Cross-Site Scripting (XSS).
2. **Inactivity Timer**: Session state automatically monitors activity. Sessions expire after 30 minutes (configurable via `VITE_SESSION_TIMEOUT_MINUTES`), purging user state from memory and generating a `SESSION_EXPIRED` audit record.
3. **Explicit Logout**: Calls `auth.logout()`, immediately resets in-memory React state, writes a `LOGOUT` audit entry, and redirects to `/login`.
