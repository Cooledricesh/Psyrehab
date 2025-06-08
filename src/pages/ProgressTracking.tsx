import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function ProgressTracking() {
  const progressData = [
    {
      patient: '김○○',
      goal: '사회적응 프로그램 참여',
      target: '주 3회 참여',
      current: '주 2.5회',
      progress: 83,
      trend: 'up'
    },
    {
      patient: '이○○',
      goal: '직업재활 훈련',
      target: '과정 수료',
      current: '45% 완료',
      progress: 45,
      trend: 'stable'
    },
    {
      patient: '박○○',
      goal: '일상생활 루틴',
      target: '규칙적 생활',
      current: '30% 개선',
      progress: 30,
      trend: 'up'
    }
  ]

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  return (
    <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">진행 추적</h1>
          <p className="text-gray-600">환자별 목표 달성 진행상황을 실시간으로 모니터링하세요</p>
        </header>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">전체 평균 진행률</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">53%</div>
            <div className="text-sm text-gray-500">전월 대비 +8%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">목표 달성률</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">23%</div>
            <div className="text-sm text-gray-500">이번 달 완료</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">참여 활성도</h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">87%</div>
            <div className="text-sm text-gray-500">주간 평균</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">개선 추세</h3>
            <div className="text-3xl font-bold text-orange-600 mb-2">↗️</div>
            <div className="text-sm text-gray-500">상승 중</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">개별 진행 현황</h2>
              <Button variant="outline">📊 차트 보기</Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {progressData.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{item.patient}</h3>
                      <p className="text-sm text-gray-600">{item.goal}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">{item.progress}%</span>
                        <span className="text-lg">{getTrendIcon(item.trend)}</span>
                      </div>
                      <p className="text-xs text-gray-500">현재: {item.current}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>목표: {item.target}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(item.progress)}`} 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">세부사항</Button>
                    <Button variant="outline" size="sm">기록 추가</Button>
                    <Button variant="outline" size="sm">차트 보기</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">주간 활동 요약</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>월요일</span>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">김○○ 참여</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">이○○ 훈련</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>화요일</span>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">박○○ 상담</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>수요일</span>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">김○○ 참여</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">이○○ 훈련</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">알림 및 주의사항</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-sm">📅 김○○ 님의 다음 평가가 3일 후입니다.</p>
              </div>
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400">
                <p className="text-sm">💡 이○○ 님의 진행률이 둔화되고 있습니다.</p>
              </div>
              <div className="p-3 bg-green-50 border-l-4 border-green-400">
                <p className="text-sm">🎉 박○○ 님이 일주일째 목표를 달성하고 있습니다!</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
} 