'use client'

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Heart, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SignUpFormData {
  email: string
  password: string
  passwordConfirm: string
  role: 'social_worker' | 'administrator' | 'patient'
  fullName: string
  employeeId?: string
  department?: string
  contactNumber?: string
}

export default function SignUpPage() {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'social_worker',
    fullName: '',
    employeeId: '',
    department: '',
    contactNumber: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return false
    }

    if (!formData.fullName.trim()) {
      setError('이름을 입력해주세요.')
      return false
    }

    if (formData.role === 'social_worker' && !formData.employeeId?.trim()) {
      setError('직원번호를 입력해주세요.')
      return false
    }

    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('사용자 생성에 실패했습니다.')
      }

      // 2. 역할에 따른 프로필 생성
      const userId = authData.user.id

      // 역할 ID 가져오기
      const roleMap = {
        'social_worker': '6a5037f6-5553-47f9-824f-bf1e767bda95',
        'administrator': 'd7fcf425-85bc-42b4-8806-917ef6939a40',
        'patient': 'b3ec265d-07cc-45a3-9f3e-5bdd0f529890'
      }

      // user_roles 테이블에 역할 할당
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleMap[formData.role]
        })

      if (roleError) {
        throw roleError
      }

      // 역할별 프로필 생성
      if (formData.role === 'social_worker') {
        const { error: profileError } = await supabase
          .from('social_workers')
          .insert({
            user_id: userId,
            full_name: formData.fullName,
            employee_id: formData.employeeId,
            department: formData.department || null,
            contact_number: formData.contactNumber || null,
            is_active: true
          })

        if (profileError) {
          throw profileError
        }
      } else if (formData.role === 'administrator') {
        const { error: profileError } = await supabase
          .from('administrators')
          .insert({
            user_id: userId,
            full_name: formData.fullName,
            employee_id: formData.employeeId,
            department: formData.department || null,
            contact_number: formData.contactNumber || null,
            is_active: true
          })

        if (profileError) {
          throw profileError
        }
      }

      // 회원가입 성공 후 로그인 페이지로 이동
      navigate('/auth/login', {
        state: { 
          message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
        }
      })

    } catch (err: unknown) {
      console.error("Error occurred")
      if (err.message?.includes('already registered')) {
        setError('이미 등록된 이메일입니다.')
      } else {
        setError(err.message || '회원가입 중 오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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

        {/* 회원가입 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              회원가입
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              새로운 계정을 만들어 서비스를 시작하세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* 역할 선택 */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  사용자 유형 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'social_worker' | 'administrator' | 'patient') => 
                    handleInputChange('role', value)
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="사용자 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_worker">사회복지사</SelectItem>
                    <SelectItem value="administrator">관리자</SelectItem>
                    <SelectItem value="patient">환자</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    required
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="이름을 입력하세요"
                    required
                    value={formData.fullName}
                    onChange={e => handleInputChange('fullName', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      value={formData.password}
                      onChange={e => handleInputChange('password', e.target.value)}
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
                      value={formData.passwordConfirm}
                      onChange={e => handleInputChange('passwordConfirm', e.target.value)}
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
              </div>

              {/* 추가 정보 (사회복지사/관리자) */}
              {(formData.role === 'social_worker' || formData.role === 'administrator') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                      직원번호 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeId"
                      type="text"
                      placeholder="직원번호를 입력하세요"
                      required
                      value={formData.employeeId}
                      onChange={e => handleInputChange('employeeId', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      부서
                    </Label>
                    <Input
                      id="department"
                      type="text"
                      placeholder="부서명을 입력하세요"
                      value={formData.department}
                      onChange={e => handleInputChange('department', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">
                      연락처
                    </Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="연락처를 입력하세요 (예: 010-0000-0000)"
                      value={formData.contactNumber}
                      onChange={e => handleInputChange('contactNumber', e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 회원가입 버튼 */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    회원가입 중...
                  </div>
                ) : (
                  '회원가입'
                )}
              </Button>

              {/* 로그인 링크 */}
              <div className="text-center pt-4">
                <span className="text-sm text-gray-600">이미 계정이 있으신가요? </span>
                <Link 
                  to="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  로그인
                </Link>
              </div>
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
