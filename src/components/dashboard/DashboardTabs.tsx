import React, { useState, useEffect } from 'react'
import { SimpleDashboard } from './SimpleDashboard'
import { AdvancedDashboard } from './AdvancedDashboard'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('simple')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userRoleData } = await supabase
          .from('user_roles')
          .select(`
            roles (
              role_name
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle()
        
        const roleName = (userRoleData as any)?.roles?.role_name
        setUserRole(roleName)
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  // 사원/주임: 간편 대시보드만
  if (userRole === 'staff' || userRole === 'assistant_manager') {
    return (
      <div className="w-full">
        <SimpleDashboard />
      </div>
    )
  }

  // 관리자: 둘 다 표시 (탭으로 전환)
  if (userRole === 'administrator') {
    return (
      <div className="w-full">
        {/* 간단한 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('simple')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'simple'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              간편 대시보드
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              고급 대시보드
            </button>
          </nav>
        </div>
        
        {/* 탭 내용 */}
        <div className="mt-4">
          {activeTab === 'simple' && <SimpleDashboard />}
          {activeTab === 'advanced' && <AdvancedDashboard />}
        </div>
      </div>
    )
  }

  // 계장 이상: 고급 대시보드만
  if (userRole === 'section_chief' || userRole === 'manager_level' || userRole === 'department_head' || 
      userRole === 'vice_director' || userRole === 'director' || userRole === 'attending_physician') {
    return (
      <div className="w-full">
        <AdvancedDashboard />
      </div>
    )
  }


  // 기본값: 간편 대시보드
  return (
    <div className="w-full">
      <SimpleDashboard />
    </div>
  )
}