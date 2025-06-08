import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Reports() {
  const reportTemplates = [
    {
      title: '개별 환자 진행 보고서',
      description: '특정 환자의 목표별 달성도와 개선 사항을 상세 분석',
      type: 'individual',
      icon: '👤'
    },
    {
      title: '전체 프로그램 효과성 보고서',
      description: '모든 환자의 전반적인 재활 효과와 프로그램 성과 평가',
      type: 'program',
      icon: '📊'
    },
    {
      title: '월간 통계 보고서',
      description: '월별 참여율, 목표 달성률, 개선 추세 등 핵심 지표 요약',
      type: 'monthly',
      icon: '📅'
    },
    {
      title: '맞춤형 분석 보고서',
      description: '특정 기간, 목표 유형, 환자 그룹 등 사용자 정의 조건으로 분석',
      type: 'custom',
      icon: '🎯'
    }
  ]

  const recentReports = [
    {
      title: '2024년 1월 월간 보고서',
      date: '2024-02-01',
      type: 'monthly',
      status: 'completed'
    },
    {
      title: '김○○ 환자 진행 보고서',
      date: '2024-01-28',
      type: 'individual',
      status: 'completed'
    },
    {
      title: '사회적응 프로그램 효과성 분석',
      date: '2024-01-25',
      type: 'program',
      status: 'generating'
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: '완료', class: 'bg-green-100 text-green-800' },
      generating: { label: '생성중', class: 'bg-yellow-100 text-yellow-800' },
      failed: { label: '실패', class: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">보고서</h1>
          <p className="text-gray-600">다양한 분석 보고서를 생성하고 관리하세요</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 새 보고서 생성 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">새 보고서 생성</h2>
            <div className="space-y-4">
              {reportTemplates.map((template, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{template.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      <Button size="sm">생성하기</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 최근 보고서 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">최근 보고서</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="space-y-4">
                  {recentReports.map((report, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-gray-500">{report.date}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(report.status)}
                        {report.status === 'completed' && (
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">보기</Button>
                            <Button variant="outline" size="sm">다운로드</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 빠른 통계 */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">빠른 통계</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">생성된 보고서</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-gray-600">이번 주 보고서</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">24</div>
                  <div className="text-sm text-gray-600">총 다운로드</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">1</div>
                  <div className="text-sm text-gray-600">생성 중</div>
                </div>
              </div>
            </div>
            
            {/* 내보내기 옵션 */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">내보내기 옵션</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" size="sm">📄 PDF</Button>
                <Button variant="outline" size="sm">📊 Excel</Button>
                <Button variant="outline" size="sm">📈 PowerPoint</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 보고서 설정 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">자동 보고서 설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">주간 요약 보고서</h4>
              <p className="text-sm text-gray-600 mb-3">매주 월요일 자동 생성</p>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="weekly" checked readOnly />
                <label htmlFor="weekly" className="text-sm">활성화</label>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">월간 통계 보고서</h4>
              <p className="text-sm text-gray-600 mb-3">매월 1일 자동 생성</p>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="monthly" checked readOnly />
                <label htmlFor="monthly" className="text-sm">활성화</label>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">분기별 성과 보고서</h4>
              <p className="text-sm text-gray-600 mb-3">분기말 자동 생성</p>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="quarterly" readOnly />
                <label htmlFor="quarterly" className="text-sm">활성화</label>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
} 