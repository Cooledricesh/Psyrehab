import React from 'react'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          대시보드
        </h1>
        <p className="text-gray-600">
          정신건강 재활 플랫폼에 오신 것을 환영합니다.
        </p>
      </div>
      <DashboardTabs />
    </div>
  )
}

export default Dashboard 