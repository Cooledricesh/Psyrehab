'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Heart, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SignUpRequestData {
  id: string
  email: string
  full_name: string
  requested_role: string
  employee_id?: string
  department?: string
  contact_number?: string
  status: string
}

export default function ApprovedSignUpPage() {
  const [signUpRequest, setSignUpRequest] = useState<SignUpRequestData | null>(null)
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
    const email = searchParams.get('email')
    if (email) {
      checkApprovedRequest(email)
    } else {
      setError('이메일 주소가 제공되지 않았습니다.')
    }
  }, [searchParams])

  const checkApprovedRequest = async (email: string) => {
    try {
      const { data: request, error } = await supabase
        .from('signup_requests')
        .select('*')
        .eq('email', email)
        .eq('status', 'approved')
        .maybeSingle()

      if (error) throw error

      if (!request) {
        setError('승인된 가입 신청을 찾을 수 없습니다. 관리자에게 문의해주세요.')
        return
      }

      setSignUpRequest(request)
    } catch (err: unknown) {
      setError('가입 신청 확인 중 오류가 발생했습니다.')
      console.error(err)
    }
  }

  const validatePassword = (password: string): boolean => {
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return false
    }
    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!signUpRequest) {
      setError('가입 신청 정보를 찾을 수 없습니다.')
      setIsLoading(false)
      return
    }

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
      // 1. Supabase Auth에 사용자 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpRequest.email,
        password: password,
        options: {
          data: {
            full_name: signUpRequest.full_name,
            role: signUpRequest.requested_role,
            signup_request_id: signUpRequest.id
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('계정 생성에 실패했습니다.')

      const userId = authData.user.id

      // 2. 역할 매핑
      const roleMap = {
        'social_worker': '6a5037f6-5553-47f9-824f-bf1e767bda95',
        'administrator': 'd7fcf425-85bc-42b4-8806-917ef6939a40'
      }

      // 3. user_roles에 역할 할당
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleMap[signUpRequest.requested_role as keyof typeof roleMap]
        })

      if (roleError) {
        console.error('역할 할당 실패:', roleError)
        // 에러가 발생해도 계속 진행 (이미 할당된 경우일 수 있음)
      }

      // 4. 프로필 생성
      const table = signUpRequest.requested_role === 'social_worker' ? 'social_workers' : 'administrators'
      const { error: profileError } = await supabase
        .from(table)
        .insert({
          user_id: userId,
          full_name: signUpRequest.full_name,
          employee_id: signUpRequest.employee_id || null,
          department: signUpRequest.department || null,
          contact_number: signUpRequest.contact_number || null,
          is_active: true
        })

      if (profileError) {
        console.error('프로필 생성 실패:', profileError)
        // 에러가 발생해도 계속 진행 (이미 생성된 경우일 수 있음)
      }

      // 5. signup_requests 업데이트
      const { error: updateError } = await supabase
        .from('signup_requests')
        .update({
          user_id: userId,
          status: 'completed'
        })
        .eq('id', signUpRequest.id)

      if (updateError) {
        console.error('신청서 업데이트 실패:', updateError)
      }

      setSuccess(true)
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/auth/login', {
          state: { 
            message: '계정이 성공적으로 생성되었습니다. 이메일을 확인해주세요.'
          }
        })
      }, 3000)

    } catch (err: unknown) {
      console.error('Sign up error:', err)
      if (err.message?.includes('already registered')) {
        setError('이미 등록된 이메일입니다. 로그인을 시도해주세요.')
      } else {
        setError(err.message || '계정 생성 중 오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'social_worker':
        return '사회복지사'
      case 'administrator':
        return '관리자'
      case 'patient':
        return '환자'
      default:
        return role
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
                계정 생성 완료
              </CardTitle>
              <CardDescription className="text-gray-600">
                계정이 성공적으로 생성되었습니다.<br />
                이메일을 확인해주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (!signUpRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6 text-center">
              <CardTitle className="text-2xl font-semibold text-red-600">
                접근 오류
              </CardTitle>
              <CardDescription className="text-gray-600">
                {error || '가입 신청 정보를 확인하는 중입니다...'}
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

        {/* 승인된 가입 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              계정 생성
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              승인된 신청서로 계정을 생성합니다
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 승인된 정보 표시 */}
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">승인된 신청 정보</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">이름:</span>
                  <span className="font-medium">{signUpRequest.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일:</span>
                  <span className="font-medium">{signUpRequest.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">역할:</span>
                  <span className="font-medium">{getRoleDisplayName(signUpRequest.requested_role)}</span>
                </div>
                {signUpRequest.employee_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">직원번호:</span>
                    <span className="font-medium">{signUpRequest.employee_id}</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 (6자 이상)"
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

              {/* 계정 생성 버튼 */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    계정 생성 중...
                  </div>
                ) : (
                  '계정 생성'
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