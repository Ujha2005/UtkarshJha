import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { UserRole } from './authTypes';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles }) => {
  const { authState, hasRole, isSessionValid } = useAuth();
  const location = useLocation();

  if (!authState.isAuthenticated || !isSessionValid()) {
    // Redirect to login page but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-6">
          You do not have the required permissions to view this page. This area requires specific roles.
        </p>
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Current Role: {authState.user?.role}</span>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
