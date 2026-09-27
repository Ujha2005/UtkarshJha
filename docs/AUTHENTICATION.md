# Authentication Architecture

## Demo Account Credentials

For demonstration purposes, the following synthetic accounts are available:

| Role | Username | Password | Description |
|---|---|---|---|
| Admin | admin | admin123 | System administrator, audit logs |
| Doctor | doctor | doctor123 | Clinical provider, patient management |
| Patient | patient | patient123 | Standard patient, views own records |
| Caregiver | caregiver | care123 | Authorized family member/aide |

*Note: In the demo environment, these credentials are used to simulate login state without querying a real backend.*

## Authentication Flow Diagram (Demo vs Production)

**Demo Flow:**
[User Input] -> [UI Validation] -> [Mock Auth Context] -> [Session Granted in React State]

**Production Flow:**
[User Input] -> [OAuth 2.0 / OIDC Provider] -> [MFA Challenge] -> [JWT Issued] -> [Backend Validates JWT] -> [Session Established]

## Session Lifecycle
1. **Login**: User authenticates using credentials (and MFA in production).
2. **Session Creation**: A session context is established. In production, an HttpOnly cookie holds the refresh token.
3. **Active Session**: API calls are made using short-lived access tokens.
4. **Timeout**: If the user is idle for a specified duration (e.g., 15 minutes), the system prompts for re-authentication.
5. **Logout**: User explicitly logs out, or session expires absolutely. Tokens are invalidated.

## Why Credentials Are NOT Stored in localStorage/sessionStorage
Storing JWTs or sensitive credentials in `localStorage` or `sessionStorage` exposes them to Cross-Site Scripting (XSS) attacks. If malicious script executes in the browser, it can easily harvest these tokens.
- **Production Recommendation**: Use a Backend-for-Frontend (BFF) pattern where the frontend only receives an opaque, secure, HttpOnly cookie, or manage tokens strictly within closure memory while utilizing a secure cookie for refresh.

## Production Migration Path (JWT, OAuth 2.0, OIDC)
To migrate CAREGRAPH to production:
1. Integrate an Identity Provider (e.g., AWS Cognito, Auth0, Keycloak).
2. Implement Authorization Code Flow with PKCE.
3. Replace the `AuthContext` mock logic with the IdP's SDK.
4. Ensure all backend API routes validate the JWT signature and audience.

## Token Refresh Strategy for Production
- Access tokens should expire in 10-15 minutes.
- A background process should seamlessly request a new access token using the HttpOnly refresh cookie just before expiration.
- If the refresh token is expired or revoked, the user is immediately routed back to the login screen.
