import React from 'react'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { EnhancedAuthProvider, useEnhancedAuth } from '@/contexts/AuthQueryContext'
import { 
  SignInForm, 
  EmailVerificationForm, 
  SessionTimeoutWarning
} from '@/components/auth'
import {
  useCurrentUser,
  useUserProfile,
  useUserSettings,
  useSignInMutation,
  useUpdateProfileMutation
} from '@/hooks/useAuthQueries'

/**
 * Example component showing TanStack Query authentication integration
 */
function AuthQueryIntegrationExample() {
  const auth = useEnhancedAuth()
  
  // Using query hooks directly (alternative to enhanced auth context)
  const userQuery = useCurrentUser()
  const profileQuery = useUserProfile()
  const settingsQuery = useUserSettings()
  
  // Using mutation hooks
  const signInMutation = useSignInMutation()
  const updateProfileMutation = useUpdateProfileMutation()

  if (auth.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">인증 정보를 확인하는 중...</p>
      </div>
    )
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <h1 className="text-2xl font-bold text-center">TanStack Query 인증 예제</h1>
          
          <SignInForm
            onSuccess={() => console.log('로그인 성공 - 쿼리가 자동으로 업데이트됩니다')}
            onForgotPassword={() => console.log('비밀번호 재설정')}
          />
          
          {/* Show authentication state */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium">인증 상태:</h3>
            <ul className="mt-2 text-sm space-y-1">
              <li>로그인 중: {auth.isAuthenticating ? '예' : '아니오'}</li>
              <li>사용자 쿼리 로딩: {userQuery.isLoading ? '예' : '아니오'}</li>
              <li>프로필 쿼리 로딩: {profileQuery.isLoading ? '예' : '아니오'}</li>
              <li>설정 쿼리 로딩: {settingsQuery.isLoading ? '예' : '아니오'}</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">TanStack Query 인증 대시보드</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">사용자 정보</h2>
            
            {userQuery.isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : userQuery.error ? (
              <p className="text-red-600">오류: {userQuery.error.message}</p>
            ) : (
              <div className="space-y-2">
                <p><strong>이메일:</strong> {userQuery.data?.email}</p>
                <p><strong>ID:</strong> {userQuery.data?.id}</p>
                <p><strong>이메일 확인:</strong> {userQuery.data?.email_confirmed_at ? '완료' : '미완료'}</p>
                <p><strong>마지막 로그인:</strong> {userQuery.data?.last_sign_in_at ? new Date(userQuery.data.last_sign_in_at).toLocaleString() : 'N/A'}</p>
              </div>
            )}
            
            <button
              onClick={() => userQuery.refetch()}
              disabled={userQuery.isFetching}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {userQuery.isFetching ? '새로고침 중...' : '사용자 정보 새로고침'}
            </button>
          </div>

          {/* Profile Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">프로필 정보</h2>
            
            {profileQuery.isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : profileQuery.error ? (
              <p className="text-red-600">오류: {profileQuery.error.message}</p>
            ) : profileQuery.data ? (
              <div className="space-y-2">
                <p><strong>이름:</strong> {profileQuery.data.full_name}</p>
                <p><strong>역할:</strong> {profileQuery.data.role}</p>
                <p><strong>부서:</strong> {profileQuery.data.department || 'N/A'}</p>
                <p><strong>생성일:</strong> {new Date(profileQuery.data.created_at).toLocaleDateString()}</p>
              </div>
            ) : (
              <p className="text-gray-500">프로필 정보가 없습니다.</p>
            )}
            
            <button
              onClick={() => profileQuery.refetch()}
              disabled={profileQuery.isFetching}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {profileQuery.isFetching ? '새로고침 중...' : '프로필 새로고침'}
            </button>
          </div>

          {/* Settings Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">설정 정보</h2>
            
            {settingsQuery.isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : settingsQuery.error ? (
              <p className="text-red-600">오류: {settingsQuery.error.message}</p>
            ) : settingsQuery.data ? (
              <div className="space-y-2">
                <p><strong>테마:</strong> {settingsQuery.data.display?.theme}</p>
                <p><strong>언어:</strong> {settingsQuery.data.display?.language}</p>
                <p><strong>이메일 알림:</strong> {settingsQuery.data.notifications?.email ? '활성화' : '비활성화'}</p>
                <p><strong>시간대:</strong> {settingsQuery.data.app?.timezone}</p>
              </div>
            ) : (
              <p className="text-gray-500">설정 정보가 없습니다.</p>
            )}
            
            <button
              onClick={() => settingsQuery.refetch()}
              disabled={settingsQuery.isFetching}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {settingsQuery.isFetching ? '새로고침 중...' : '설정 새로고침'}
            </button>
          </div>
        </div>

        {/* Mutation Examples */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">뮤테이션 예제</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">프로필 업데이트</h3>
              <button
                onClick={() => {
                  updateProfileMutation.mutate({
                    full_name: '업데이트된 이름 ' + new Date().getTime()
                  })
                }}
                disabled={updateProfileMutation.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? '업데이트 중...' : '이름 업데이트'}
              </button>
              
              {updateProfileMutation.error && (
                <p className="mt-2 text-sm text-red-600">
                  오류: {updateProfileMutation.error.message}
                </p>
              )}
              
              {updateProfileMutation.isSuccess && (
                <p className="mt-2 text-sm text-green-600">
                  프로필이 성공적으로 업데이트되었습니다!
                </p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">인증 데이터 새로고침</h3>
              <button
                onClick={() => auth.refreshUserData()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                모든 인증 데이터 새로고침
              </button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">로그아웃</h3>
              <button
                onClick={() => auth.signOut()}
                disabled={auth.isAuthenticating}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {auth.isAuthenticating ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>

        {/* Query State Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">쿼리 상태 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2">사용자 쿼리</h3>
              <div className="text-sm space-y-1">
                <p>상태: {userQuery.status}</p>
                <p>로딩: {userQuery.isLoading ? '예' : '아니오'}</p>
                <p>에러: {userQuery.error ? '있음' : '없음'}</p>
                <p>Fresh: {userQuery.isFresh ? '예' : '아니오'}</p>
                <p>Stale: {userQuery.isStale ? '예' : '아니오'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">프로필 쿼리</h3>
              <div className="text-sm space-y-1">
                <p>상태: {profileQuery.status}</p>
                <p>로딩: {profileQuery.isLoading ? '예' : '아니오'}</p>
                <p>에러: {profileQuery.error ? '있음' : '없음'}</p>
                <p>Fresh: {profileQuery.isFresh ? '예' : '아니오'}</p>
                <p>Stale: {profileQuery.isStale ? '예' : '아니오'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">설정 쿼리</h3>
              <div className="text-sm space-y-1">
                <p>상태: {settingsQuery.status}</p>
                <p>로딩: {settingsQuery.isLoading ? '예' : '아니오'}</p>
                <p>에러: {settingsQuery.error ? '있음' : '없음'}</p>
                <p>Fresh: {settingsQuery.isFresh ? '예' : '아니오'}</p>
                <p>Stale: {settingsQuery.isStale ? '예' : '아니오'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning />
    </div>
  )
}

/**
 * Complete app wrapper showing proper provider setup
 */
export function AuthQueryApp() {
  return (
    <QueryProvider>
      <AuthProvider>
        <EnhancedAuthProvider>
          <AuthQueryIntegrationExample />
        </EnhancedAuthProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default AuthQueryIntegrationExample 