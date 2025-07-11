'use client'

import { UserLoginHistory } from '@/components/admin/UserLoginHistory'

export default function AdminDashboard() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더 */}
      <div className="px-4 lg:px-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">시스템 관리 및 사용자 활동을 모니터링하세요</p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* 사용자 로그인 이력 */}
          <div className="px-4 lg:px-6">
            <UserLoginHistory />
          </div>
        </div>
      </div>
    </div>
  )
}
