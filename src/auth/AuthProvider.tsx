import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContextType, AuthState, LoginCredentials, UserRole } from './authTypes';
import { authService } from './authService';
import { auditLog } from '@/services/auditLog';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  session: null,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // DEMO ONLY: We store session in memory. In a real app we would check HttpOnly cookies or secure storage
  // and validate a token with the backend.

  const logout = useCallback(() => {
    setAuthState(initialState);
  }, []);

  const isSessionValid = useCallback(() => {
    return !authService.isSessionExpired(authState.session);
  }, [authState.session]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const user = await authService.authenticateUser(credentials);

      if (user) {
        const session = authService.createSession(user);
        setAuthState({
          isAuthenticated: true,
          user,
          session,
          isLoading: false,
          error: null,
        });

        // Audit log successful login
        auditLog.logAuditEvent({
          action: 'LOGIN',
          userId: user.id,
          userRole: user.role,
          userName: user.displayName,
          targetResource: 'Auth/Session',
          outcome: 'success',
          sessionId: session.sessionId,
          details: `User ${user.username} successfully authenticated (${user.role} role)`
        });

        return true;
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Invalid username or password',
        }));

        // Audit log failed login
        auditLog.logAuditEvent({
          action: 'LOGIN_FAILED',
          userId: 'anonymous',
          userRole: 'ANONYMOUS',
          userName: credentials.username || 'unknown',
          targetResource: 'Auth/Login',
          outcome: 'failure',
          details: `Failed authentication attempt for username: ${credentials.username}`
        });

        return false;
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'An error occurred during login',
      }));
      return false;
    }
  };

  const hasRole = useCallback(
    (roleOrRoles: UserRole | UserRole[]) => {
      if (!authState.user) return false;
      
      const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
      return roles.includes(authState.user.role);
    },
    [authState.user]
  );

  // Session timeout check
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (authState.isAuthenticated && authState.session) {
      interval = setInterval(() => {
        if (!isSessionValid()) {
          logout();
          // Could dispatch a toast notification here
          console.warn('Session expired. Logging out.');
        }
      }, 60000); // Check every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authState.isAuthenticated, authState.session, isSessionValid, logout]);

  return (
    <AuthContext.Provider value={{ authState, login, logout, hasRole, isSessionValid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
