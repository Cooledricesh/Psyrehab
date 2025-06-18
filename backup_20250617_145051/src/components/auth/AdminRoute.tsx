import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Permission } from '@/types/auth';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // true면 모든 권한 필요, false면 하나라도 있으면 됨
  fallback?: ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredPermissions = [],
  requireAll = false,
  fallback,
}) => {
  const { 
    isAuthenticated, 
    isAdmin, 
    isLoading, 
    user,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions 
  } = useAdminAuth();
  const location = useLocation();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/admin/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 관리자가 아닌 경우
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            접근 권한이 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            이 페이지에 접근하려면 관리자 권한이 필요합니다.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 특정 권한이 필요한 경우
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? checkAllPermissions(requiredPermissions)
      : checkAnyPermission(requiredPermissions);

    if (!hasRequiredPermissions) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              권한이 부족합니다
            </h1>
            <p className="text-gray-600 mb-4">
              이 페이지에 접근하려면 추가 권한이 필요합니다.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p>현재 사용자: {user?.name} ({user?.role})</p>
              <p className="mt-1">
                필요한 권한: {requiredPermissions.join(', ')}
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      );
    }
  }

  // 모든 조건을 만족하는 경우
  return <>{children}</>;
};

// HOC 버전
export const withAdminRoute = <P extends object>(
  Component: React.ComponentType<P>,
  routeProps?: Omit<AdminRouteProps, 'children'>
) => {
  return (props: P) => (
    <AdminRoute {...routeProps}>
      <Component {...props} />
    </AdminRoute>
  );
};

// 권한 체크 컴포넌트 (UI 요소 숨기기/보이기용)
interface PermissionGateProps {
  children: ReactNode;
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  const { checkAnyPermission, checkAllPermissions } = useAdminAuth();

  const hasPermission = requireAll
    ? checkAllPermissions(permissions)
    : checkAnyPermission(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AdminRoute; 