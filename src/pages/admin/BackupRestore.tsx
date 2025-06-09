import React, { useState, useEffect } from 'react'
import type { BackupItem, BackupStats } from '@/types/backup'
import { BackupStatsPanel } from '@/components/admin/BackupStatsPanel'
import { BackupsList } from '@/components/admin/BackupsList'
import { mockBackups, generateMockStats } from '@/utils/mockBackupData'

export const BackupRestore: React.FC = () => {
  const [backups] = useState<BackupItem[]>(mockBackups)
  const [stats] = useState<BackupStats>(generateMockStats())
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'backups' | 'schedules' | 'restore'>('overview')

  // Mock 함수들
  const handleDownload = (backup: BackupItem) => {
    console.log('다운로드:', backup.name)
    // 실제 구현에서는 파일 다운로드 API 호출
    alert(`${backup.name} 다운로드를 시작합니다.`)
  }

  const handleRestore = (backup: BackupItem) => {
    console.log('복원:', backup.name)
    // 실제 구현에서는 복원 프로세스 시작
    if (confirm(`${backup.name}를 복원하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
      alert(`${backup.name} 복원을 시작합니다.`)
    }
  }

  const handleDelete = (backup: BackupItem) => {
    console.log('삭제:', backup.name)
    // 실제 구현에서는 백업 삭제 API 호출
    if (confirm(`${backup.name}를 영구적으로 삭제하시겠습니까?`)) {
      alert(`${backup.name}이 삭제되었습니다.`)
    }
  }

  const handleCancel = (backup: BackupItem) => {
    console.log('취소:', backup.name)
    // 실제 구현에서는 진행 중인 백업 취소
    if (confirm(`${backup.name} 백업을 취소하시겠습니까?`)) {
      alert(`${backup.name} 백업이 취소되었습니다.`)
    }
  }

  const handleCreateBackup = () => {
    console.log('새 백업 생성')
    // 실제 구현에서는 백업 생성 모달 열기
    alert('새 백업 생성 기능은 아직 구현 중입니다.')
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            백업 및 복원 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            시스템 데이터의 백업 생성, 관리 및 복원을 수행합니다.
          </p>
        </div>
        
        <button
          onClick={handleCreateBackup}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새 백업 생성
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: '개요', icon: '📊' },
            { id: 'backups', name: '백업 목록', icon: '📦' },
            { id: 'schedules', name: '스케줄', icon: '⏰' },
            { id: 'restore', name: '복원', icon: '🔄' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 통계 패널 */}
            <BackupStatsPanel stats={stats} isLoading={isLoading} />
            
            {/* 최근 백업 활동 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                최근 백업 활동
              </h2>
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'completed' ? 'bg-green-500' : 
                        activity.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {activity.type} 백업
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(activity.date).toLocaleDateString()}</span>
                      <span>{(activity.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 빠른 액션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={handleCreateBackup}
                className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                  즉시 백업
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  현재 시스템 상태의 백업을 즉시 생성합니다.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('schedules')}
                className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">⏰</div>
                <h3 className="font-medium text-green-700 dark:text-green-300 mb-1">
                  스케줄 관리
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  자동 백업 스케줄을 설정하고 관리합니다.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('restore')}
                className="p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🔄</div>
                <h3 className="font-medium text-orange-700 dark:text-orange-300 mb-1">
                  데이터 복원
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  백업으로부터 데이터를 복원합니다.
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <BackupsList
            backups={backups}
            isLoading={isLoading}
            onDownload={handleDownload}
            onRestore={handleRestore}
            onDelete={handleDelete}
            onCancel={handleCancel}
          />
        )}

        {activeTab === 'schedules' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏰</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                백업 스케줄 관리
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                자동 백업 스케줄 기능은 아직 구현 중입니다.
              </p>
              <button
                onClick={() => alert('스케줄 관리 기능 구현 예정')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                스케줄 생성
              </button>
            </div>
          </div>
        )}

        {activeTab === 'restore' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔄</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                데이터 복원 관리
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                복원 작업 관리 기능은 아직 구현 중입니다.
              </p>
              <button
                onClick={() => alert('복원 관리 기능 구현 예정')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                복원 시작
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 