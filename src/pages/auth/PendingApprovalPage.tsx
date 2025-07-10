import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle, Mail, Phone, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { handleApiError } from '@/utils/error-handler'

export default function PendingApprovalPage() {
  const [userInfo, setUserInfo] = useState<{
    email: string
    full_name: string
    requested_role: string
    status: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      // 현재 로그인된 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/auth/login')
        return
      }

      // signup_requests에서 사용자 정보 확인
      const { data: signupRequest } = await supabase
        .from('signup_requests')
        .select('email, full_name, requested_role, status')
        .eq('email', user.email)
        .single()

      if (signupRequest) {
        setUserInfo(signupRequest)
        
        // 이미 승인된 경우 대시보드로 이동
        if (signupRequest.status === 'approved') {
          navigate('/dashboard')
          return
        }
      }
    } catch (error) {
      handleApiError(error, 'PendingApprovalPage.checkUserStatus')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'social_worker': return '사회복지사'
      case 'administrator': return '관리자'
      case 'patient': return '환자'
      default: return role
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">상태 확인 중...</span>
        </div>
      </div>
    )
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

        {/* 승인 대기 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              이메일 인증 완료!
            </CardTitle>
            <CardDescription className="text-gray-600">
              관리자 승인을 기다리고 있습니다
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {userInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">가입 신청 정보</span>
                </div>
                <div className="ml-7 space-y-2 text-sm text-gray-700">
                  <div><span className="font-medium">이메일:</span> {userInfo.email}</div>
                  <div><span className="font-medium">이름:</span> {userInfo.full_name}</div>
                  <div><span className="font-medium">신청 유형:</span> {getRoleDisplayName(userInfo.requested_role)}</div>
                  <div><span className="font-medium">상태:</span> 
                    <span className="ml-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      승인 대기
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-medium text-amber-900">승인 대기 중</h3>
                  <p className="text-sm text-amber-800">
                    이메일 인증이 완료되었습니다. 관리자가 회원가입을 승인할 때까지 잠시 기다려주세요.
                    승인이 완료되면 모든 기능을 이용하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">다음 단계</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• 관리자가 가입 신청을 검토합니다</p>
                    <p>• 승인이 완료되면 이메일로 알림을 받습니다</p>
                    <p>• 승인 후 다시 로그인하여 서비스를 이용하세요</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-medium text-blue-900">문의사항</h3>
                  <p className="text-sm text-blue-800">
                    승인 과정에서 문제가 있거나 급한 경우, 시스템 관리자에게 직접 문의하시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={checkUserStatus}
                variant="outline"
                className="flex-1"
              >
                상태 새로고침
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex-1"
              >
                로그아웃
              </Button>
            </div>
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