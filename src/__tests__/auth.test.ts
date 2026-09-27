import { describe, it, expect } from 'vitest';
import { authService, DEMO_ACCOUNTS } from '@/auth/authService';

describe('CAREGRAPH Authentication Architecture', () => {
  it('authenticates valid demo patient credentials', async () => {
    const user = await authService.authenticateUser({
      username: 'patient.demo',
      password: 'demo123',
    });
    expect(user).not.toBeNull();
    expect(user?.role).toBe('PATIENT');
    expect(user?.displayName).toBe('Rajesh Kumar Sharma');
  });

  it('authenticates valid demo doctor credentials', async () => {
    const user = await authService.authenticateUser({
      username: 'doctor.demo',
      password: 'demo123',
    });
    expect(user).not.toBeNull();
    expect(user?.role).toBe('DOCTOR');
    expect(user?.displayName).toBe('Dr. Rajan Mehta');
  });

  it('rejects invalid password', async () => {
    const user = await authService.authenticateUser({
      username: 'patient.demo',
      password: 'wrongpassword',
    });
    expect(user).toBeNull();
  });

  it('rejects unknown username', async () => {
    const user = await authService.authenticateUser({
      username: 'nonexistent.user',
      password: 'demo123',
    });
    expect(user).toBeNull();
  });

  it('creates an AuthSession with 30-minute expiry', () => {
    const sampleUser = DEMO_ACCOUNTS[0];
    const session = authService.createSession(sampleUser);
    expect(session.sessionId).toMatch(/^sess_/);
    expect(session.user.id).toBe(sampleUser.id);

    const loginTime = new Date(session.loginAt).getTime();
    const expiryTime = new Date(session.expiresAt).getTime();
    const diffMinutes = Math.round((expiryTime - loginTime) / (60 * 1000));
    expect(diffMinutes).toBe(30);

    expect(authService.isSessionExpired(session)).toBe(false);
  });

  it('correctly flags an expired session', () => {
    const sampleUser = DEMO_ACCOUNTS[0];
    const expiredSession = {
      user: sampleUser,
      sessionId: 'sess_expired_123',
      loginAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };
    expect(authService.isSessionExpired(expiredSession)).toBe(true);
  });

  it('returns all 4 demo accounts for quick-persona login', () => {
    const accounts = authService.getDemoAccounts();
    expect(accounts).toHaveLength(4);
    expect(accounts.map(a => a.role)).toEqual(['PATIENT', 'DOCTOR', 'CAREGIVER', 'ADMIN']);
  });
});
