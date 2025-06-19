import React, { useState } from 'react'

export const ManualAuthTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const clearResults = () => {
    setResults([])
  }

  const testEmailValidation = () => {
    addResult('=== 이메일 검증 테스트 ===')
    
    const validEmails = ['test@example.com', 'user.name@domain.co.kr', 'admin@company.org']
    const invalidEmails = ['invalid-email', '@domain.com', 'user@', 'user.domain.com']
    
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    
    validEmails.forEach(email => {
      const isValid = isValidEmail(email)
      addResult(`✅ 유효한 이메일: ${email} → ${isValid ? '통과' : '실패'}`)
    })
    
    invalidEmails.forEach(email => {
      const isValid = isValidEmail(email)
      addResult(`❌ 무효한 이메일: ${email} → ${isValid ? '실패' : '통과'}`)
    })
  }

  const testPasswordValidation = () => {
    addResult('=== 비밀번호 검증 테스트 ===')
    
    const passwords = [
      { password: 'SecureP@ssw0rd123', expected: true, description: '강력한 비밀번호' },
      { password: 'password123', expected: true, description: '기본 비밀번호' },
      { password: '123456', expected: false, description: '짧은 비밀번호' },
      { password: '', expected: false, description: '빈 비밀번호' },
    ]
    
    passwords.forEach(({ password, expected, description }) => {
      const isValid = password.length >= 8
      const result = isValid === expected ? '통과' : '실패'
      const icon = result === '통과' ? '✅' : '❌'
      addResult(`${icon} ${description}: "${password}" → ${result}`)
    })
  }

  const testAuthStateManagement = () => {
    addResult('=== 인증 상태 관리 테스트 ===')
    
    let authState = { isAuthenticated: false, user: null }
    
    const mockUser = { id: '123', email: 'test@example.com', name: '테스트 사용자' }
    authState = { isAuthenticated: true, user: mockUser }
    addResult(`✅ 로그인 시뮬레이션: 인증 상태 = ${authState.isAuthenticated}`)
    addResult(`   사용자 정보: ${JSON.stringify(authState.user)}`)
    
    authState = { isAuthenticated: false, user: null }
    addResult(`✅ 로그아웃 시뮬레이션: 인증 상태 = ${authState.isAuthenticated}`)
    addResult(`   사용자 정보: ${authState.user}`)
  }

  const testRoleBasedAccess = () => {
    addResult('=== 역할 기반 접근 제어 테스트 ===')
    
    const users = [
      { id: '1', role: 'admin', permissions: ['read', 'write', 'delete'] },
      { id: '2', role: 'moderator', permissions: ['read', 'write'] },
      { id: '3', role: 'user', permissions: ['read'] }
    ]
    
    const hasPermission = (user: unknown, permission: string) => 
      user.permissions?.includes(permission) || false
    
    const testPermissions = ['read', 'write', 'delete']
    
    users.forEach(user => {
      addResult(`--- ${user.role} 사용자 (ID: ${user.id}) ---`)
      testPermissions.forEach(permission => {
        const hasAccess = hasPermission(user, permission)
        const icon = hasAccess ? '✅' : '❌'
        addResult(`${icon} ${permission} 권한: ${hasAccess ? '허용' : '거부'}`)
      })
    })
  }

  const testFormValidation = () => {
    addResult('=== 폼 검증 테스트 ===')
    
    const validateSignInForm = (email: string, password: string) => {
      const errors: string[] = []
      
      if (!email) {
        errors.push('이메일을 입력해 주세요.')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('올바른 이메일 형식을 입력해 주세요.')
      }
      
      if (!password) {
        errors.push('비밀번호를 입력해 주세요.')
      } else if (password.length < 8) {
        errors.push('비밀번호는 8자 이상이어야 합니다.')
      }
      
      return { isValid: errors.length === 0, errors }
    }
    
    const testCases = [
      { email: 'test@example.com', password: 'password123', description: '유효한 폼' },
      { email: '', password: '', description: '빈 폼' },
      { email: 'invalid-email', password: 'password123', description: '무효한 이메일' },
      { email: 'test@example.com', password: '123', description: '짧은 비밀번호' }
    ]
    
    testCases.forEach(({ email, password, description }) => {
      const validation = validateSignInForm(email, password)
      const icon = validation.isValid ? '✅' : '❌'
      addResult(`${icon} ${description}: ${validation.isValid ? '통과' : '실패'}`)
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          addResult(`   오류: ${error}`)
        })
      }
    })
  }

  const testErrorHandling = () => {
    addResult('=== 오류 처리 테스트 ===')
    
    const simulateAuthError = (errorType: string) => {
      const errors: Record<string, string> = {
        'invalid_credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
        'user_not_found': '사용자를 찾을 수 없습니다.',
        'email_not_confirmed': '이메일 인증이 필요합니다.',
        'rate_limit_exceeded': '너무 많은 요청이 발생했습니다.',
        'network_error': '네트워크 오류가 발생했습니다.',
        'server_error': '서버 오류가 발생했습니다.',
        'unknown_error': '알 수 없는 오류가 발생했습니다.'
      }
      
      return errors[errorType] || '처리되지 않은 오류입니다.'
    }
    
    const errorTypes = [
      'invalid_credentials',
      'user_not_found', 
      'email_not_confirmed',
      'rate_limit_exceeded',
      'network_error',
      'unknown_error'
    ]
    
    errorTypes.forEach(errorType => {
      const message = simulateAuthError(errorType)
      addResult(`✅ 오류 타입 '${errorType}': ${message}`)
    })
  }

  const testSessionManagement = () => {
    addResult('=== 세션 관리 테스트 ===')
    
    const createSession = (user: unknown, expiresInMinutes: number = 60) => ({
      user,
      accessToken: `token_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
      expiresAt: Date.now() + (expiresInMinutes * 60 * 1000),
      isValid: true
    })
    
    const isSessionValid = (session: unknown) => {
      return session.isValid && session.expiresAt > Date.now()
    }
    
    const mockUser = { id: '123', email: 'test@example.com' }
    
    const validSession = createSession(mockUser, 60)
    addResult(`✅ 유효한 세션 생성: ${isSessionValid(validSession) ? '성공' : '실패'}`)
    addResult(`   만료 시간: ${new Date(validSession.expiresAt).toLocaleString()}`)
    
    const expiredSession = createSession(mockUser, -1) // Expired 1 minute ago
    addResult(`✅ 만료된 세션 검증: ${isSessionValid(expiredSession) ? '실패' : '성공'}`)
    
    const refreshedSession = { ...expiredSession, expiresAt: Date.now() + 3600000 }
    addResult(`✅ 세션 갱신 시뮬레이션: ${isSessionValid(refreshedSession) ? '성공' : '실패'}`)
  }

  const runAllTests = async () => {
    setIsLoading(true)
    clearResults()
    
    addResult('🚀 인증 시스템 테스트 시작')
    addResult('=====================================')
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testEmailValidation()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testPasswordValidation()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testAuthStateManagement()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testRoleBasedAccess()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testFormValidation()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testErrorHandling()
    
    await new Promise(resolve => setTimeout(resolve, 100))
    testSessionManagement()
    
    addResult('=====================================')
    addResult('✅ 모든 테스트 완료!')
    
    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          인증 시스템 수동 테스트
        </h1>
        <p className="text-gray-600">
          인증 관련 기능들을 수동으로 테스트할 수 있습니다.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '테스트 실행 중...' : '전체 테스트 실행'}
        </button>
        
        <button
          onClick={testEmailValidation}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          이메일 검증
        </button>
        
        <button
          onClick={testPasswordValidation}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          비밀번호 검증
        </button>
        
        <button
          onClick={testAuthStateManagement}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          인증 상태 관리
        </button>
        
        <button
          onClick={testRoleBasedAccess}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          역할 기반 접근제어
        </button>
        
        <button
          onClick={testFormValidation}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          폼 검증
        </button>
        
        <button
          onClick={testErrorHandling}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          오류 처리
        </button>
        
        <button
          onClick={testSessionManagement}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          세션 관리
        </button>
        
        <button
          onClick={clearResults}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          결과 지우기
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          테스트 결과
        </h2>
        
        {results.length === 0 ? (
          <p className="text-gray-500 italic">
            테스트를 실행하여 결과를 확인하세요.
          </p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  result.includes('✅') 
                    ? 'bg-green-100 text-green-800'
                    : result.includes('❌')
                    ? 'bg-red-100 text-red-800'
                    : result.includes('===')
                    ? 'bg-blue-100 text-blue-800 font-semibold'
                    : result.includes('---')
                    ? 'bg-yellow-100 text-yellow-800 font-medium'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <pre className="whitespace-pre-wrap font-mono">{result}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>참고:</strong> 이 테스트는 인증 시스템의 기본 로직을 검증합니다. 
          실제 Supabase 연동 테스트는 개발 환경에서 수행하세요.
        </p>
      </div>
    </div>
  )
}

export default ManualAuthTest 