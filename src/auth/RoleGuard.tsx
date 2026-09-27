import React, { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { UserRole } from './authTypes';

interface RoleGuardProps {
  allowedRoles: UserRole | UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
  showMessage = false,
}) => {
  const { hasRole } = useAuth();

  if (hasRole(allowedRoles)) {
    return <>{children}</>;
  }

  if (showMessage) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm text-center">
        Content restricted (requires role: {Array.isArray(allowedRoles) ? allowedRoles.join(', ') : allowedRoles})
      </div>
    );
  }

  return <>{fallback}</>;
};
