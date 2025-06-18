import { Link } from 'react-router-dom'
import { Shield, Users, Activity, Database, FileText } from 'lucide-react'

export default function AdminQuickAccess() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">관리자 빠른 접근</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          to="/admin/dashboard"
          className="p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
        >
          <Activity className="w-8 h-8 mb-2 text-blue-600" />
          <h3 className="font-semibold">관리자 대시보드</h3>
          <p className="text-sm text-gray-600">시스템 통계 확인</p>
        </Link>

        <Link 
          to="/admin/users"
          className="p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
        >
          <Users className="w-8 h-8 mb-2 text-green-600" />
          <h3 className="font-semibold">사용자 관리</h3>
          <p className="text-sm text-gray-600">승인 대기 사용자 관리</p>
        </Link>

        <Link 
          to="/admin/logs"
          className="p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
        >
          <FileText className="w-8 h-8 mb-2 text-purple-600" />
          <h3 className="font-semibold">시스템 로그</h3>
          <p className="text-sm text-gray-600">시스템 활동 로그</p>
        </Link>

        <Link 
          to="/admin/backup-restore"
          className="p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
        >
          <Database className="w-8 h-8 mb-2 text-orange-600" />
          <h3 className="font-semibold">백업/복원</h3>
          <p className="text-sm text-gray-600">데이터 백업 관리</p>
        </Link>
      </div>
    </div>
  )
}
