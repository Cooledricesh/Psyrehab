'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { handleApiError } from '@/utils/error-handler'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // URL에서 토큰 확인
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      // 토큰을 세션에 설정
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    }
  }, [searchParams])

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return false
    }
    return true
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!validatePassword(password)) {
      setIsLoading(false)
      return
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/auth/login', {
          state: { 
            message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.'
          }
        })
      }, 3000)

    } catch (err: unknown) {
      handleApiError(err, 'ResetPasswordPage.handleResetPassword')
      setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                비밀번호 변경 완료
              </CardTitle>
              <CardDescription className="text-gray-600">
                비밀번호가 성공적으로 변경되었습니다.<br />
                잠시 후 로그인 페이지로 이동합니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 브랜딩 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-blue-600">PsyRehab</h1>
              <p className="text-sm text-gray-600">정신 재활 계획 수립 프로그램</p>
            </div>
          </div>
        </div>

        {/* 비밀번호 재설정 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              비밀번호 재설정
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              새로운 비밀번호를 설정해주세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* 새 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  새 비밀번호 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="새 비밀번호 (6자 이상)"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 비밀번호 변경 버튼 */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    비밀번호 변경 중...
                  </div>
                ) : (
                  '비밀번호 변경'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2024 PsyRehab. 정신건강 전문가를 위한 재활 계획 수립 시스템
          </p>
        </div>
      </div>
    </div>
  )
}