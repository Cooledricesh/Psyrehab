import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { logEnvironmentStatus } from '@/lib/env'
import { testSupabaseConnection } from '@/lib/supabase'

function App() {
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  useEffect(() => {
    // Log environment status in development
    if (import.meta.env.DEV) {
      logEnvironmentStatus()
    }
    
    // Test Supabase connection
    testSupabaseConnection()
      .then((success) => {
        setSupabaseStatus(success ? 'connected' : 'error')
      })
      .catch(() => {
        setSupabaseStatus('error')
      })
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
          정신장애인 재활 목표 관리 플랫폼
        </h1>
        
        {/* Development status indicator */}
        {import.meta.env.DEV && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h2 className="text-sm font-semibold mb-2">개발 환경 상태</h2>
            <div className="flex items-center space-x-4 text-sm">
              <span>Supabase:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                supabaseStatus === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                supabaseStatus === 'connected' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {supabaseStatus === 'loading' ? '연결 중...' :
                 supabaseStatus === 'connected' ? '연결됨' :
                 '연결 실패'}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg text-gray-600 text-center max-w-2xl">
            정신과 사회복지사가 환자의 재활 목표를 체계적으로 관리하는 웹
            플랫폼입니다. AI 기반 목표 추천과 계층적 목표 관리 시스템을
            제공합니다.
          </p>
          <div className="flex space-x-4">
            <Button>시작하기</Button>
            <Button variant="outline">더 알아보기</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
