import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
          정신장애인 재활 목표 관리 플랫폼
        </h1>
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg text-gray-600 text-center max-w-2xl">
            정신과 사회복지사가 환자의 재활 목표를 체계적으로 관리하는 웹
            플랫폼입니다. AI 기반 목표 추천과 계층적 목표 관리 시스템을
            제공합니다.
          </p>
          <div className="flex space-x-4">
            <Button>시작하기</Button>
            <Button variant="outline">더 알아보기</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
