import { Link } from 'react-router-dom'
import { Users, Target, TrendingUp, FileText, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          정신건강 재활 플랫폼
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          전문적인 정신건강 관리와 재활 프로그램을 제공합니다. 
          환자 중심의 맞춤형 케어 솔루션으로 더 나은 회복을 지원합니다.
        </p>
        <Link to="/dashboard" className="inline-flex items-center gap-2">
          <button className="btn btn-primary text-lg px-8 py-3">
            대시보드로 이동
            <ArrowRight size={20} />
          </button>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
                     <div className="mb-4">
             <div className="inline-block p-3 bg-blue-50 rounded-lg">
               <Users size={24} className="text-blue-600" />
             </div>
           </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            환자 관리
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            종합적인 환자 정보 관리와 진료 기록 시스템
          </p>
          <Link to="/patient-management">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-green-50 rounded-lg">
              <Target size={24} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            목표 설정
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            AI 기반 개인화된 재활 목표 수립과 관리
          </p>
          <Link to="/goal-setting">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-yellow-50 rounded-lg">
              <TrendingUp size={24} className="text-yellow-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            진행 추적
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            실시간 진행상황 모니터링과 데이터 분석
          </p>
          <Link to="/progress-tracking">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow duration-200">
          <div className="mb-4">
            <div className="inline-block p-3 bg-pink-50 rounded-lg">
              <FileText size={24} className="text-pink-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            보고서
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            종합적인 진료 보고서 및 통계 데이터
          </p>
          <Link to="/reports">
            <button className="btn btn-secondary w-full">
              시작하기
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          플랫폼 현황
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                     <div>
             <div className="text-4xl font-bold text-blue-600 mb-2">
               150+
             </div>
             <div className="text-gray-600">등록된 환자</div>
           </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">
              95%
            </div>
            <div className="text-gray-600">목표 달성률</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              24/7
            </div>
            <div className="text-gray-600">모니터링 시스템</div>
          </div>
        </div>
      </div>
    </div>
  )
} 