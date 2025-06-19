import { useState, useEffect } from 'react'
import { testSupabaseConnection } from '@/lib/supabase'

const APP_NAME = 'PsyRehab'
const APP_VERSION = '1.0.0'

export default function DevStatus() {
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading')

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await testSupabaseConnection()
        setSupabaseStatus(isConnected ? 'connected' : 'error')
      } catch {
        console.error("Error occurred")
        setSupabaseStatus('error')
      }
    }

    checkConnection()
  }, [])

  // 개발 환경이 아니면 렌더링하지 않음
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <section 
      id="dev-status" 
      className="bg-gray-100 p-3 border-b text-center text-sm" 
      aria-label="개발 환경 상태"
      tabIndex={-1}
    >
      <div className="container mx-auto flex justify-center items-center space-x-4">
        <span className="font-semibold">개발 환경</span>
        <span>|</span>
        <span>{APP_NAME} v{APP_VERSION}</span>
        <span>|</span>
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
  )
} 