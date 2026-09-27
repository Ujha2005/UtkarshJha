export type UserRole = 'PATIENT' | 'DOCTOR' | 'CAREGIVER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  linkedPatientId?: string; // For PATIENT role
  linkedDoctorId?: string; // For DOCTOR role
  avatar?: string;
  isDemo: boolean;
}

export interface AuthSession {
  user: User;
  loginAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  sessionId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isSessionValid: () => boolean;
}

export interface IAuthService {
  authenticateUser(credentials: LoginCredentials): Promise<User | null> | User | null;
  createSession(user: User): AuthSession;
  isSessionExpired(session: AuthSession | null): boolean;
  getDemoAccounts(): { id: string; username: string; displayName: string; role: UserRole }[];
}
