import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SkipLinks } from '@/components/ui/skip-links'
import { logEnvironmentStatus } from '@/lib/env'
import { testSupabaseConnection } from '@/lib/supabase'
import { APP_NAME, APP_VERSION, formatDate } from '@/utils'

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
      {/* Skip Navigation Links */}
      <SkipLinks 
        links={[
          { href: '#main-content', label: '메인 콘텐츠로 건너뛰기' },
          { href: '#app-actions', label: '앱 액션으로 건너뛰기' },
          { href: '#dev-status', label: '개발 상태로 건너뛰기' },
        ]}
      />
      
      <main id="main-content" className="container mx-auto p-8" tabIndex={-1}>
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-blue-600">
            {APP_NAME} - 정신장애인 재활 목표 관리 플랫폼
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            버전 {APP_VERSION} | 빌드 날짜: {formatDate(new Date())}
          </p>
        </header>
        
        {/* Development status indicator */}
        {import.meta.env.DEV && (
          <section 
            id="dev-status" 
            className="mb-6 p-4 border rounded-lg bg-gray-50" 
            aria-label="개발 환경 상태"
            tabIndex={-1}
          >
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
          </section>
        )}
        
        <section id="app-actions" className="flex flex-col items-center space-y-4" tabIndex={-1}>
          <p className="text-lg text-gray-600 text-center max-w-2xl">
            정신과 사회복지사가 환자의 재활 목표를 체계적으로 관리하는 웹
            플랫폼입니다. AI 기반 목표 추천과 계층적 목표 관리 시스템을
            제공합니다.
          </p>
          <div className="flex space-x-4">
            <Button>시작하기</Button>
            <Button variant="outline">더 알아보기</Button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
