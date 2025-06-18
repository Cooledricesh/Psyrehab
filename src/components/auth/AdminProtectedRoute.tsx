import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // 관리자 역할 확인
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)
        .eq('role_id', 'd7fcf425-85bc-42b4-8806-917ef6939a40') // administrator role id
        .single()

      setIsAdmin(!!userRole)
    } catch (error) {
      console.error('Admin check error:', error)
      setIsAdmin(false)
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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
