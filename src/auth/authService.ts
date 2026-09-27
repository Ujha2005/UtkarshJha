import { User, LoginCredentials, AuthSession, IAuthService } from './authTypes';

// DEMO ONLY: In a real production application, this would use JWT, OAuth 2.0 / OIDC, or session cookies
// and credentials would NEVER be hardcoded on the client side.

export const DEMO_ACCOUNTS: User[] = [
  {
    id: 'u1',
    username: 'patient.demo',
    displayName: 'Rajesh Kumar Sharma',
    email: 'rajesh.demo@example.com',
    role: 'PATIENT',
    linkedPatientId: 'p1',
    isDemo: true,
  },
  {
    id: 'u2',
    username: 'doctor.demo',
    displayName: 'Dr. Rajan Mehta',
    email: 'dr.rajan@example.com',
    role: 'DOCTOR',
    linkedDoctorId: 'd4',
    isDemo: true,
  },
  {
    id: 'u3',
    username: 'caregiver.demo',
    displayName: 'Aarti Sharma',
    email: 'aarti.demo@example.com',
    role: 'CAREGIVER',
    isDemo: true,
  },
  {
    id: 'u4',
    username: 'admin.demo',
    displayName: 'System Admin',
    email: 'admin.demo@example.com',
    role: 'ADMIN',
    isDemo: true,
  },
];

const DEMO_PASSWORD = 'demo123';

export class DemoAuthService implements IAuthService {
  public authenticateUser(credentials: LoginCredentials): User | null {
    if (credentials.password !== DEMO_PASSWORD) {
      return null;
    }

    const user = DEMO_ACCOUNTS.find((u) => u.username === credentials.username);
    return user || null;
  }

  public createSession(user: User): AuthSession {
    const now = new Date();
    // 30 minutes session expiry
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    return {
      user,
      loginAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      sessionId: `sess_${Math.random().toString(36).substring(2, 9)}_${now.getTime()}`,
    };
  }

  public isSessionExpired(session: AuthSession | null): boolean {
    if (!session) return true;
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return now > expiresAt;
  }

  public getDemoAccounts(): { id: string; username: string; displayName: string; role: User['role'] }[] {
    return DEMO_ACCOUNTS.map(({ id, username, displayName, role }) => ({
      id,
      username,
      displayName,
      role,
    }));
  }
}

export const authService: IAuthService = new DemoAuthService();
