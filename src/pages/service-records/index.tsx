import React, { useState } from 'react'
import { Plus, FileText, BarChart3, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ServiceRecordsList, ServiceRecordForm, ServiceRecordDetail } from '@/components/service-records'
import type { ServiceRecordWithDetails } from '@/types/database'

export default function ServiceRecordsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecordWithDetails | null>(null)
  const [editingRecord, setEditingRecord] = useState<ServiceRecordWithDetails | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  const handleNewRecord = () => {
    setEditingRecord(null)
    setShowForm(true)
  }

  const handleEditRecord = (record: ServiceRecordWithDetails) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleViewRecord = (record: ServiceRecordWithDetails) => {
    setSelectedRecord(record)
    setActiveTab('detail')
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingRecord(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingRecord(null)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">서비스 레코드 관리</h1>
          <p className="text-gray-600 mt-2">
            상담 및 서비스 제공 기록을 관리하고 추적합니다.
          </p>
        </div>
        <Button onClick={handleNewRecord} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          새 레코드 등록
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            레코드 목록
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2" disabled={!selectedRecord}>
            <Calendar className="h-4 w-4" />
            상세 보기
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            통계 및 분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ServiceRecordsList
            onRecordSelect={handleViewRecord}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          {selectedRecord ? (
            <ServiceRecordDetail
              record={selectedRecord}
              onEdit={handleEditRecord}
              className="w-full"
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                레코드를 선택해주세요
              </h3>
              <p className="text-gray-600">
                목록에서 레코드를 선택하여 상세 정보를 확인하세요.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              통계 및 분석
            </h3>
            <p className="text-gray-600">
              서비스 레코드 통계 기능이 곧 추가될 예정입니다.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Record Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? '서비스 레코드 수정' : '새 서비스 레코드 등록'}
            </DialogTitle>
          </DialogHeader>
          <ServiceRecordForm
            existingRecord={editingRecord || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 