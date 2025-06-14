import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { SimpleDashboard } from '@/components/dashboard/SimpleDashboard'
import { SimpleProtectedRoute } from '@/components/auth/SimpleProtectedRoute'

// 실제 페이지 컴포넌트들
import Home from '@/pages/Home'
import GoalSetting from '@/pages/GoalSetting'
import ProgressTracking from '@/pages/ProgressTracking'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import PatientManagement from '@/pages/PatientManagement'
import { SystemLogs } from '@/pages/admin/SystemLogs'
import { BackupRestore } from '@/pages/admin/BackupRestore'
import AnnouncementsManagement from '@/pages/admin/AnnouncementsManagement'

// 인증 페이지 컴포넌트
import LoginPage from '@/pages/auth/LoginPage'

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
})

// 임시 환자 관리 (Supabase 문제 해결 후 실제 컴포넌트 사용)
function SimplePatientManagement() {
  const mockPatients = [
    { id: '1', name: '김○○', age: 28, diagnosis: '조현병', date: '2024-01-15', status: 'active' },
    { id: '2', name: '이○○', age: 34, diagnosis: '양극성 장애', date: '2024-02-20', status: 'active' },
    { id: '3', name: '박○○', age: 31, diagnosis: '우울증', date: '2024-03-10', status: 'inactive' },
    { id: '4', name: '최○○', age: 25, diagnosis: '사회불안장애', date: '2024-03-25', status: 'active' }
  ]

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800'
    }
    const labels = { active: '활성', inactive: '비활성' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">환자 관리</h1>
        <p className="text-gray-600">등록된 환자들을 관리하고 정보를 확인하세요</p>
      </header>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">환자 목록</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              + 새 환자 등록
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">나이</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">진단</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">등록일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {mockPatients.map((patient) => (
                  <tr key={patient.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{patient.name}</td>
                    <td className="py-3 px-4">{patient.age}세</td>
                    <td className="py-3 px-4">{patient.diagnosis}</td>
                    <td className="py-3 px-4">{patient.date}</td>
                    <td className="py-3 px-4">{getStatusBadge(patient.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
                          상세보기
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
                          편집
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// SimpleDashboard는 별도 컴포넌트로 분리함

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* 인증 관련 라우트 (레이아웃 없음) */}
          <Route path="/auth/login" element={<LoginPage />} />
          
          {/* 메인 애플리케이션 라우트 (레이아웃 포함 + 인증 보호) */}
          <Route path="/*" element={
            <SimpleProtectedRoute>
              <div className="min-h-screen flex bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<SimpleDashboard />} />
                      <Route path="/patient-management" element={<PatientManagement />} />
                      <Route path="/goal-setting" element={<GoalSetting />} />
                      <Route path="/progress-tracking" element={<ProgressTracking />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/admin/logs" element={<SystemLogs />} />
                      <Route path="/admin/backup-restore" element={<BackupRestore />} />
                      <Route path="/admin/announcements" element={<AnnouncementsManagement />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SimpleProtectedRoute>
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
