import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function GoalSetting() {
  return (
    <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">목표 설정</h1>
          <p className="text-gray-600">환자별 재활 목표를 설정하고 관리하세요</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">새 목표 설정</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">환자 선택</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>김○○</option>
                    <option>이○○</option>
                    <option>박○○</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">목표 범주</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>사회적응</option>
                    <option>직업재활</option>
                    <option>일상생활 기능</option>
                    <option>대인관계</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">목표 제목</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="예: 주 3회 사회복지관 프로그램 참여" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">상세 설명</label>
                  <textarea className="w-full p-2 border rounded-md h-24" placeholder="목표에 대한 상세한 설명을 입력하세요"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">시작일</label>
                    <input type="date" className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">목표일</label>
                    <input type="date" className="w-full p-2 border rounded-md" />
                  </div>
                </div>
                <Button className="w-full">목표 저장</Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">AI 추천 목표</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-md">
                  <div className="font-medium text-sm">사회복지관 프로그램 참여</div>
                  <div className="text-xs text-gray-500">사회적응 향상을 위한 그룹 활동</div>
                </div>
                <div className="p-3 border rounded-md">
                  <div className="font-medium text-sm">직업훈련 과정 수료</div>
                  <div className="text-xs text-gray-500">취업 준비를 위한 기술 습득</div>
                </div>
                <div className="p-3 border rounded-md">
                  <div className="font-medium text-sm">일상생활 루틴 정착</div>
                  <div className="text-xs text-gray-500">규칙적인 생활 패턴 형성</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">최근 목표</h3>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-green-500 bg-green-50">
                  <div className="font-medium text-sm">김○○ - 사회적응 프로그램</div>
                  <div className="text-xs text-gray-500">진행률 75%</div>
                </div>
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                  <div className="font-medium text-sm">이○○ - 직업재활 훈련</div>
                  <div className="text-xs text-gray-500">진행률 45%</div>
                </div>
                <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                  <div className="font-medium text-sm">박○○ - 일상생활 기능</div>
                  <div className="text-xs text-gray-500">진행률 30%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
} 