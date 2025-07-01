import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface ManagementProtectedRouteProps {
  children: React.ReactNode
}

export function ManagementProtectedRoute({ children }: ManagementProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    checkManagementAccess()
  }, [])

  const checkManagementAccess = async () => {
    try {
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setHasAccess(false)
        setIsLoading(false)
        return
      }

      // 사용자 역할 확인
      const { data: userRole } = await supabase
        .from('user_roles')
        .select(`
          roles (
            role_name
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (userRole) {
        const roleName = (userRole as any).roles?.role_name
        // 계장 이상 직급 및 관리자
        const managementRoles = ['section_chief', 'manager_level', 'department_head', 'vice_director', 'director', 'administrator']
        setHasAccess(managementRoles.includes(roleName))
      } else {
        setHasAccess(false)
      }
    } catch {
      console.error("Error occurred")
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}