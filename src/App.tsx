import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import Dashboard from '@/pages/Dashboard'
import { SimpleProtectedRoute } from '@/components/auth/SimpleProtectedRoute'
import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute'
import { ManagementProtectedRoute } from '@/components/auth/ManagementProtectedRoute'

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
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/UserManagement'
import PatientAssignment from '@/pages/admin/PatientAssignment'
import AIArchivePage from '@/pages/admin/AIArchivePage'
import PermissionsPage from '@/pages/admin/PermissionsPage'
import { PatientDetailPage } from '@/pages/PatientDetailPage'
import { PatientEditPage } from '@/components/patients/PatientEditPage'

// 인증 페이지 컴포넌트
import LoginPage from '@/pages/auth/LoginPage'
import SignUpPage from '@/pages/auth/SignUpPage'
import SignUpSuccessPage from '@/pages/auth/SignUpSuccessPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ApprovedSignUpPage from '@/pages/auth/ApprovedSignUpPage'
import PendingApprovalPage from '@/pages/auth/PendingApprovalPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
})


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* 인증 관련 라우트 (레이아웃 없음) */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/auth/signup-success" element={<SignUpSuccessPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/approved-signup" element={<ApprovedSignUpPage />} />
          <Route path="/auth/email-confirmed" element={<PendingApprovalPage />} />
          <Route path="/auth/pending-approval" element={<PendingApprovalPage />} />
          
          {/* 메인 애플리케이션 라우트 (레이아웃 포함 + 인증 보호) */}
          <Route path="/*" element={
            <SimpleProtectedRoute>
              <div className="h-screen flex bg-gray-50 overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
                  <Header />
                  <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/patient-management" element={<PatientManagement />} />
                      <Route path="/patients/:id" element={<PatientDetailPage />} />
                      <Route path="/patients/:id/edit" element={<PatientEditPage />} />
                      <Route path="/goal-setting" element={<GoalSetting />} />
                      <Route path="/progress-tracking" element={<ProgressTracking />} />
                      <Route path="/reports" element={<AdminProtectedRoute><Reports /></AdminProtectedRoute>} />
                      <Route path="/settings" element={<AdminProtectedRoute><Settings /></AdminProtectedRoute>} />
                      
                      {/* 관리 페이지 (계장 이상 접근 가능) */}
                      <Route path="/admin" element={<ManagementProtectedRoute><AdminDashboard /></ManagementProtectedRoute>} />
                      <Route path="/admin/dashboard" element={<ManagementProtectedRoute><AdminDashboard /></ManagementProtectedRoute>} />
                      <Route path="/admin/patient-assignment" element={<ManagementProtectedRoute><PatientAssignment /></ManagementProtectedRoute>} />
                      <Route path="/admin/announcements" element={<ManagementProtectedRoute><AnnouncementsManagement /></ManagementProtectedRoute>} />
                      
                      {/* 시스템 관리자 전용 라우트 */}
                      <Route path="/admin/users" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />
                      <Route path="/admin/logs" element={<AdminProtectedRoute><SystemLogs /></AdminProtectedRoute>} />
                      <Route path="/admin/backup-restore" element={<AdminProtectedRoute><BackupRestore /></AdminProtectedRoute>} />
                      <Route path="/admin/ai-archive" element={<AdminProtectedRoute><AIArchivePage /></AdminProtectedRoute>} />
                      <Route path="/admin/permissions" element={<AdminProtectedRoute><PermissionsPage /></AdminProtectedRoute>} />
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
