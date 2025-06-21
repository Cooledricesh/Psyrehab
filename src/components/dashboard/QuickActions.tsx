import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Target, 
  Calendar, 
  FileText, 
  Download, 
  Settings,
  Users,
  BarChart3
} from 'lucide-react'

export function QuickActions() {
  const quickActions = [
    {
      icon: UserPlus,
      title: '새 환자 등록',
      description: '신규 환자 정보를 시스템에 등록',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => console.log('새 환자 등록')
    },
    {
      icon: Target,
      title: '목표 설정',
      description: '환자의 재활 목표를 새로 설정',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: () => console.log('목표 설정')
    },
    {
      icon: Calendar,
      title: '세션 예약',
      description: '환자와의 상담 세션 예약',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      action: () => console.log('세션 예약')
    },
    {
      icon: FileText,
      title: '진행 기록',
      description: '환자의 진행 상황 및 평가 기록',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      action: () => console.log('진행 기록')
    },
    {
      icon: BarChart3,
      title: '성과 분석',
      description: '환자별 재활 성과 분석 리포트',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100',
      action: () => console.log('성과 분석')
    },
    {
      icon: Download,
      title: '데이터 내보내기',
      description: '환자 데이터 및 통계를 파일로 내보내기',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      action: () => console.log('데이터 내보내기')
    },
    {
      icon: Users,
      title: '환자 목록',
      description: '전체 환자 목록 조회 및 관리',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 hover:bg-rose-100',
      action: () => console.log('환자 목록')
    },
    {
      icon: Settings,
      title: '시스템 설정',
      description: '알림, 권한 등 시스템 설정 관리',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      action: () => console.log('시스템 설정')
    }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          빠른 작업
        </CardTitle>
        <CardDescription>
          자주 사용하는 기능들에 빠르게 접근할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon
            return (
              <Button
                key={index}
                variant="ghost"
                className={`h-auto flex-col gap-2 p-4 ${action.bgColor} border-0`}
                onClick={action.action}
              >
                <div className={`rounded-full p-2 ${action.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${action.color}`} />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm text-gray-900">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {action.description}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* 추가 정보 섹션 */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">시스템 알림</h4>
              <p className="text-xs text-gray-500 mt-1">
                현재 시스템이 정상적으로 작동 중입니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">온라인</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">98.5%</div>
              <div className="text-xs text-gray-500">시스템 가동률</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">24/7</div>
              <div className="text-xs text-gray-500">지원 운영시간</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}