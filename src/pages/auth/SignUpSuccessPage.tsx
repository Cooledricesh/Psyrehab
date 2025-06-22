'use client'

import { useLocation, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Heart, Clock, Mail } from 'lucide-react'

interface LocationState {
  email?: string
  role?: string
  message?: string
}

export default function SignUpSuccessPage() {
  const location = useLocation()
  const state = location.state as LocationState

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

        {/* 성공 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              가입 신청 완료
            </CardTitle>
            <CardDescription className="text-gray-600">
              {state?.message || '가입 신청이 성공적으로 제출되었습니다.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 신청 정보 */}
            {state?.email && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">신청 정보</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일:</span>
                    <span className="font-medium">{state.email}</span>
                  </div>
                  {state.role && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">신청 역할:</span>
                      <span className="font-medium">{getRoleDisplayName(state.role)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 다음 단계 안내 */}
            <div className="bg-amber-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="w-4 h-4" />
                <span className="font-medium">다음 단계</span>
              </div>
              <div className="space-y-2 text-sm text-amber-700">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>관리자가 신청서를 검토합니다</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>승인 시 이메일로 계정 활성화 링크를 전송합니다</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>이메일 확인 후 정상적으로 로그인 가능합니다</span>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="text-center text-sm text-gray-600">
              <p>승인까지 영업일 기준 1-2일 정도 소요될 수 있습니다.</p>
              <p className="mt-1">문의사항이 있으시면 관리자에게 연락해주세요.</p>
            </div>

            {/* 로그인 페이지로 이동 */}
            <Button asChild className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              <Link to="/auth/login">
                로그인 페이지로 이동
              </Link>
            </Button>
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