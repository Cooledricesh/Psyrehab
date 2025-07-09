'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { resetPassword } from '@/services'
import { toast } from 'sonner'
import { handleApiError } from '@/utils/error-handler'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await resetPassword(email)
      
      if (result.success) {
        setIsEmailSent(true)
        toast.success('비밀번호 재설정 이메일이 발송되었습니다.')
      } else {
        setError(result.error || '이메일 발송에 실패했습니다.')
      }
    } catch (error) {
      handleApiError(error, 'ForgotPasswordPage.handleSubmit')
      setError('이메일 발송 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/auth/login')
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

        {/* 뒤로 가기 버튼 */}
        <Button
          variant="ghost"
          onClick={handleBackToLogin}
          className="mb-6 text-gray-600 hover:text-gray-800 p-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          로그인으로 돌아가기
        </Button>

        {/* 비밀번호 찾기 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              비밀번호 찾기
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {isEmailSent 
                ? '이메일을 확인해주세요' 
                : '가입시 사용한 이메일 주소를 입력하세요'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!isEmailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이메일 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일 주소
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* 전송 버튼 */}
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      이메일 발송 중...
                    </div>
                  ) : (
                    '비밀번호 재설정 이메일 발송'
                  )}
                </Button>
              </form>
            ) : (
              /* 이메일 발송 완료 상태 */
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-800">
                        이메일이 발송되었습니다!
                      </p>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{email}</span>로 비밀번호 재설정 링크를 보냈습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">다음 단계:</h4>
                    <ol className="space-y-1 text-blue-700">
                      <li>1. 이메일 받은편지함을 확인하세요</li>
                      <li>2. "비밀번호 재설정" 링크를 클릭하세요</li>
                      <li>3. 새로운 비밀번호를 설정하세요</li>
                    </ol>
                  </div>
                  
                  <p className="text-center">
                    이메일이 오지 않았나요? 스팸함도 확인해보세요.
                  </p>
                </div>

                <Button 
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="w-full h-11"
                >
                  로그인 페이지로 돌아가기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 PsyRehab. 정신건강 전문가를 위한 재활 계획 수립 시스템
          </p>
        </div>
      </div>
    </div>
  )
}