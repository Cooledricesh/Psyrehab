import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function PendingApproval() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            승인 대기 중
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            회원가입이 완료되었습니다
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  관리자가 귀하의 계정을 검토하고 있습니다.
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  승인이 완료되면 로그인하여 시스템을 이용하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">다음 단계:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>관리자가 제출하신 정보를 검토합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>승인이 완료되면 이메일로 알림을 받으실 수 있습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>승인 후 로그인하여 모든 기능을 이용하실 수 있습니다</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              상태 새로고침
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              문의사항이 있으시면 관리자에게 연락해주세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
