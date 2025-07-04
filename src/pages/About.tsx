import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { CheckCircle, Brain, Users, ChartBar } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Navigation */}
      <div className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold text-blue-600">PsyRehab</div>
        <div className="space-x-4">
          <Link to="/auth/login">
            <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              로그인
            </Button>
          </Link>
          <Link to="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              가입하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          정신장애인 재활의 <span className="text-blue-600">새로운 시작</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI 기반 맞춤형 목표 설정과 체계적인 진행 관리로<br />
          더 나은 재활 성과를 경험하세요
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg">
              시작하기
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
              기존 사용자 로그인
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          PsyRehab의 핵심 기능
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">AI 기반 목표 추천</h3>
            <p className="text-gray-600">
              환자의 상태와 이력을 분석하여 최적화된 재활 목표를 자동으로 제안합니다
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <ChartBar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">실시간 진행 추적</h3>
            <p className="text-gray-600">
              목표 달성률과 진행 상황을 한눈에 파악하고 체계적으로 관리합니다
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">협업 도구</h3>
            <p className="text-gray-600">
              사회복지사와 의료진이 함께 환자를 관리할 수 있는 협업 환경을 제공합니다
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            왜 PsyRehab인가요?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">체계적인 목표 관리</h3>
                <p className="text-gray-600">개인별 맞춤 목표 설정부터 달성까지 전 과정을 체계적으로 관리합니다</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">데이터 기반 의사결정</h3>
                <p className="text-gray-600">축적된 데이터를 기반으로 더 나은 재활 계획을 수립할 수 있습니다</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">안전한 데이터 관리</h3>
                <p className="text-gray-600">의료 정보 보안 기준을 준수하여 환자 정보를 안전하게 보호합니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">활성 사용자</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10,000+</div>
              <div className="text-gray-600">관리 중인 목표</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">사용자 만족도</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            정신장애인 재활 관리의 새로운 기준을 경험해보세요
          </p>
          <Link to="/auth/sign-up">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg">
              시작하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2025 PsyRehab. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}