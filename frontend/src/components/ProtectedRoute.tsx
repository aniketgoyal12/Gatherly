import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-navy-800 tracking-wide">
          Verifying session credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role);

    if (!hasRole) {
      return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-cream-50 border border-cream-300 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-coral-50 text-coral-600 flex items-center justify-center mx-auto border border-coral-200">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-coral-600 bg-coral-50 px-2.5 py-1 rounded-full border border-coral-200">
                403 Forbidden
              </span>
              <h1 className="text-2xl font-black text-navy-950 tracking-tight">
                Access Restricted
              </h1>
              <p className="text-xs text-navy-700 leading-relaxed">
                Your current account role is{' '}
                <strong className="text-navy-950 capitalize">{user.role.replace('_', ' ')}</strong>,
                which does not have access permissions for this workspace.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cream-100 border border-cream-300 text-left text-xs text-navy-700">
              <span className="font-bold text-navy-900 block mb-1">Required Permissions:</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedRoles.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-md bg-navy-950 text-cream-100 text-[10px] font-mono font-medium capitalize"
                  >
                    {r.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link to="/" className="flex-1">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-navy-700/30 text-xs font-semibold text-navy-950 hover:bg-cream-200 transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Public Home</span>
                </button>
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-950 text-xs font-semibold text-cream-100 hover:bg-navy-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
