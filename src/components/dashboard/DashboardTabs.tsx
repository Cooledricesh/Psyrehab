import React, { useState } from 'react'
import { SimpleDashboard } from './SimpleDashboard'
import { AdvancedDashboard } from './AdvancedDashboard'

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('simple')

  return (
    <div className="w-full">
      {/* 간단한 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('simple')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'simple'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            간편 대시보드
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'advanced'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            고급 대시보드
          </button>
        </nav>
      </div>
      
      {/* 탭 내용 */}
      <div className="mt-4">
        {activeTab === 'simple' && <SimpleDashboard />}
        {activeTab === 'advanced' && <AdvancedDashboard />}
      </div>
    </div>
  )
}