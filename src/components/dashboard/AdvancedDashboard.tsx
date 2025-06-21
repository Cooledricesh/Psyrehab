import React from 'react'
import { RehabStatsCards } from './RehabStatsCards'
import { ProgressChart } from './ProgressChart'
import { PatientsDataTable } from './PatientsDataTable'
import { QuickActions } from './QuickActions'

export function AdvancedDashboard() {
  return (
    <div className="flex flex-1 flex-col">
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