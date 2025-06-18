import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface SimpleProtectedRouteProps {
  children: React.ReactNode
}

export function SimpleProtectedRoute({ children }: SimpleProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasRole, setHasRole] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        // 세션 확인
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session && mounted) {
          console.log('No session, redirecting to login')
          navigate('/auth/login')
          setIsLoading(false)
          return
        }

        if (!mounted) return

        setIsAuthenticated(true)
        console.log('Session found:', session.user.email)

        // 역할 확인 - 사용자가 여러 역할을 가질 수 있으므로 .limit(1) 사용
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', session.user.id)
          .limit(1)

        if (!mounted) return

        console.log('User role:', userRole)
        setHasRole(!!userRole && userRole.length > 0)
        setIsLoading(false)

        // 역할이 없고 승인 대기 페이지가 아니면 리다이렉트
        if ((!userRole || userRole.length === 0) && location.pathname !== '/auth/pending-approval') {
          console.log('No role, redirecting to pending approval')
          navigate('/auth/pending-approval')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          navigate('/auth/login')
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // cleanup
    return () => {
      mounted = false
    }
  }, []) // 마운트 시에만 실행

  // 별도로 auth state 변화 감지
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_OUT') {
          navigate('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // 역할이 없고 승인 대기 페이지가 아니면 null 반환 (리다이렉트 중)
  if (!hasRole && location.pathname !== '/auth/pending-approval') {
    return null
  }

  return <>{children}</>
}
