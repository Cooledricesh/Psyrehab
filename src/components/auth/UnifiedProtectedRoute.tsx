import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import type { UserRole, Permission } from '@/types/auth';

// Protected Route Options Interface
interface ProtectedRouteOptions {
  // Authentication
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  
  // Authorization
  allowedRoles?: UserRole | UserRole[];
  requiredPermissions?: Permission | Permission[];
  requireAllPermissions?: boolean;
  
  // Admin-specific
  requireAdmin?: boolean;
  minAdminLevel?: number;
  
  // Redirects and fallbacks
  redirectTo?: string;
  fallback?: React.ComponentType;
  loadingComponent?: React.ComponentType;
}

interface UnifiedProtectedRouteProps extends ProtectedRouteOptions {
  children: React.ReactNode;
}

// Default loading component
const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">로딩 중...</span>
  </div>
);

// Default access denied component
const DefaultAccessDeniedComponent: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한이 없습니다</h1>
    <p className="text-gray-600 mb-6">이 페이지에 접근할 권한이 없습니다.</p>
    <button 
      onClick={() => window.history.back()} 
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      이전 페이지로 돌아가기
    </button>
  </div>
);

export function UnifiedProtectedRoute({
  children,
  requireAuth = true,
  requireEmailVerification = false,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  requireAdmin = false,
  minAdminLevel = 1,
  redirectTo,
  fallback: FallbackComponent = DefaultAccessDeniedComponent,
  loadingComponent: LoadingComponent = DefaultLoadingComponent
}: UnifiedProtectedRouteProps) {
  const auth = useUnifiedAuth();
  const location = useLocation();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (auth.initialized) {
      setAccessChecked(true);
    }
  }, [auth.initialized]);

  // Show loading while auth is initializing
  if (!auth.initialized || !accessChecked) {
    return <LoadingComponent />;
  }

  // Check authentication requirement
  if (requireAuth && !auth.isAuthenticated) {
    const loginRedirect = redirectTo || `/auth/login?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={loginRedirect} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerification && auth.user && !auth.user.email_confirmed_at) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !auth.isAdmin) {
    return <FallbackComponent />;
  }

  // Check minimum admin level
  if (requireAdmin && minAdminLevel > 1 && auth.getAdminLevel() < minAdminLevel) {
    return <FallbackComponent />;
  }

  // Check role requirements
  if (allowedRoles && auth.role) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(auth.role)) {
      return <FallbackComponent />;
    }
  }

  // Check permission requirements
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    const hasAccess = requireAllPermissions 
      ? auth.hasAllPermissions(permissions)
      : auth.hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <FallbackComponent />;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}

// Specialized route components for common use cases

// Admin-only route
export function AdminRoute({ 
  children, 
  minLevel = 1,
  ...props 
}: Omit<UnifiedProtectedRouteProps, 'requireAdmin' | 'minAdminLevel'> & { 
  minLevel?: number 
}) {
  return (
    <UnifiedProtectedRoute 
      requireAdmin 
      minAdminLevel={minLevel}
      {...props}
    >
      {children}
    </UnifiedProtectedRoute>
  );
}

// Social worker route (admin or social worker)
export function SocialWorkerRoute({ 
  children, 
  ...props 
}: Omit<UnifiedProtectedRouteProps, 'allowedRoles'>) {
  return (
    <UnifiedProtectedRoute 
      allowedRoles={['admin', 'social_worker']}
      {...props}
    >
      {children}
    </UnifiedProtectedRoute>
  );
}

// Patient route (any authenticated user)
export function PatientRoute({ 
  children, 
  ...props 
}: Omit<UnifiedProtectedRouteProps, 'requireAuth'>) {
  return (
    <UnifiedProtectedRoute 
      requireAuth
      {...props}
    >
      {children}
    </UnifiedProtectedRoute>
  );
}

// Permission-based route
export function PermissionRoute({ 
  children, 
  permissions,
  requireAll = false,
  ...props 
}: Omit<UnifiedProtectedRouteProps, 'requiredPermissions' | 'requireAllPermissions'> & {
  permissions: Permission | Permission[];
  requireAll?: boolean;
}) {
  return (
    <UnifiedProtectedRoute 
      requiredPermissions={permissions}
      requireAllPermissions={requireAll}
      {...props}
    >
      {children}
    </UnifiedProtectedRoute>
  );
}

// Role-based route wrapper component
interface RoleRouteProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ComponentType;
}

export function RoleRoute({ roles, children, fallback }: RoleRouteProps) {
  return (
    <UnifiedProtectedRoute 
      allowedRoles={roles}
      fallback={fallback}
    >
      {children}
    </UnifiedProtectedRoute>
  );
}

// HOC for protecting components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: ProtectedRouteOptions = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <UnifiedProtectedRoute {...options}>
        <Component {...props} />
      </UnifiedProtectedRoute>
    );
  };
}

// Hook for checking access within components
export function useAccessControl() {
  const auth = useUnifiedAuth();
  
  const checkAccess = (options: ProtectedRouteOptions): boolean => {
    // Check authentication requirement
    if (options.requireAuth && !auth.isAuthenticated) {
      return false;
    }

    // Check admin requirement
    if (options.requireAdmin && !auth.isAdmin) {
      return false;
    }

    // Check minimum admin level
    if (options.requireAdmin && options.minAdminLevel && auth.getAdminLevel() < options.minAdminLevel) {
      return false;
    }

    // Check role requirements
    if (options.allowedRoles && auth.role) {
      const roles = Array.isArray(options.allowedRoles) ? options.allowedRoles : [options.allowedRoles];
      if (!roles.includes(auth.role)) {
        return false;
      }
    }

    // Check permission requirements
    if (options.requiredPermissions) {
      const permissions = Array.isArray(options.requiredPermissions) ? options.requiredPermissions : [options.requiredPermissions];
      
      const hasAccess = options.requireAllPermissions 
        ? auth.hasAllPermissions(permissions)
        : auth.hasAnyPermission(permissions);
      
      if (!hasAccess) {
        return false;
      }
    }

    return true;
  };

  return {
    checkAccess,
    canAccessAdmin: () => auth.isAdmin,
    canAccessRole: (roles: UserRole | UserRole[]) => {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return auth.role ? roleArray.includes(auth.role) : false;
    },
    canAccessPermission: (permissions: Permission | Permission[], requireAll = false) => {
      const permArray = Array.isArray(permissions) ? permissions : [permissions];
      return requireAll ? auth.hasAllPermissions(permArray) : auth.hasAnyPermission(permArray);
    }
  };
}

export default UnifiedProtectedRoute;