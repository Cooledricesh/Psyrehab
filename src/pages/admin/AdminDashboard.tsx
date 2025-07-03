'use client'

import { RehabStatsCards } from '@/components/dashboard/RehabStatsCards'
import { ProgressChart } from '@/components/dashboard/ProgressChart'
import { PatientsDataTable } from '@/components/dashboard/PatientsDataTable'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default function AdminDashboard() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더 */}
      <div className="px-4 lg:px-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">재활 프로그램 현황 및 통계를 한눈에 확인하세요</p>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* 통계 카드 섹션 */}
          <RehabStatsCards />
          
          {/* 차트 섹션 */}
          <div className="px-4 lg:px-6">
            <ProgressChart />
          </div>
          
          {/* 빠른 작업 섹션 */}
          <div className="px-4 lg:px-6">
            <QuickActions />
          </div>
          
          {/* 환자 데이터 테이블 */}
          <PatientsDataTable />
        </div>
      </div>
    </div>
  )
}
