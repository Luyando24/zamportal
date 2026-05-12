import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireCitizen?: boolean;
  checkPortalSlug?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requireCitizen = false,
  checkPortalSlug = false
}) => {
  const { session, loading, isAdmin, isSuperAdmin, isStaff } = useAuth();
  const location = useLocation();
  const { portalSlug } = useParams();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-20">
        <div className="space-y-4 w-full max-w-lg">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin && !isStaff) {
    return <Navigate to="/" replace />;
  }

  if (requireCitizen && (isAdmin || isSuperAdmin) && !isStaff) {
    // Redirect admins to their respective dashboards
    if (isSuperAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (session.portalSlug) {
      return <Navigate to={`/dashboard/${session.portalSlug}`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check if institutional admin is accessing their assigned portal
  if (checkPortalSlug && !isSuperAdmin && portalSlug) {
    const userPortalSlug = session.portalSlug;
    if (userPortalSlug && userPortalSlug !== portalSlug) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
