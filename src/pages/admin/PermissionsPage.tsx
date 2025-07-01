'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Users, Settings, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import type { UserRole, Permission } from '@/types/auth'
import { ROLE_PERMISSIONS, ROLE_NAMES } from '@/types/auth'

// 권한 카테고리별 분류
const PERMISSION_CATEGORIES = {
  '사용자 관리': [
    'manage_users',
    'manage_social_workers', 
    'manage_patients',
    'user:create',
    'user:read',
    'user:update',
    'user:delete'
  ],
  '환자 관리': [
    'patient:create',
    'patient:read',
    'patient:update',
    'patient:delete',
    'manage_assigned_patients',
    'view_patient_data'
  ],
  '목표 및 평가': [
    'manage_goals',
    'create_goals',
    'update_goals',
    'view_own_goals',
    'manage_assessments',
    'create_assessments',
    'assessment:create',
    'assessment:read',
    'assessment:update',
    'assessment:delete'
  ],
  '서비스 및 세션': [
    'manage_services',
    'session:create',
    'session:read',
    'session:update',
    'session:delete'
  ],
  '시스템 관리': [
    'manage_system_settings',
    'view_all_data',
    'system:config:read',
    'system:config:update',
    'system:logs:read',
    'system:backup:create',
    'system:backup:restore'
  ],
  '분석 및 보고서': [
    'view_analytics',
    'view_own_analytics',
    'report:read',
    'report:export'
  ],
  '공지사항': [
    'announcement:create',
    'announcement:read',
    'announcement:update',
    'announcement:delete'
  ],
  '개인 정보': [
    'view_own_data',
    'update_own_profile',
    'submit_check_ins'
  ]
}

// 권한 설명
const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'manage_users': '모든 사용자 계정을 관리할 수 있습니다',
  'manage_social_workers': '사회복지사 계정을 관리할 수 있습니다',
  'manage_patients': '환자 정보를 관리할 수 있습니다',
  'view_all_data': '시스템의 모든 데이터를 조회할 수 있습니다',
  'manage_system_settings': '시스템 설정을 변경할 수 있습니다',
  'view_analytics': '전체 분석 데이터를 조회할 수 있습니다',
  'manage_goals': '모든 목표를 관리할 수 있습니다',
  'manage_assessments': '모든 평가를 관리할 수 있습니다',
  'manage_services': '서비스 기록을 관리할 수 있습니다',
  'manage_assigned_patients': '담당 환자를 관리할 수 있습니다',
  'create_goals': '새로운 목표를 생성할 수 있습니다',
  'update_goals': '목표를 수정할 수 있습니다',
  'view_patient_data': '환자 데이터를 조회할 수 있습니다',
  'create_assessments': '새로운 평가를 생성할 수 있습니다',
  'view_own_analytics': '자신의 분석 데이터를 조회할 수 있습니다',
  'view_own_data': '자신의 데이터를 조회할 수 있습니다',
  'update_own_profile': '자신의 프로필을 수정할 수 있습니다',
  'view_own_goals': '자신의 목표를 조회할 수 있습니다',
  'submit_check_ins': '체크인을 제출할 수 있습니다',
  'user:create': '사용자를 생성할 수 있습니다',
  'user:read': '사용자 정보를 조회할 수 있습니다',
  'user:update': '사용자 정보를 수정할 수 있습니다',
  'user:delete': '사용자를 삭제할 수 있습니다',
  'patient:create': '환자를 등록할 수 있습니다',
  'patient:read': '환자 정보를 조회할 수 있습니다',
  'patient:update': '환자 정보를 수정할 수 있습니다',
  'patient:delete': '환자를 삭제할 수 있습니다',
  'session:create': '세션을 생성할 수 있습니다',
  'session:read': '세션을 조회할 수 있습니다',
  'session:update': '세션을 수정할 수 있습니다',
  'session:delete': '세션을 삭제할 수 있습니다',
  'system:config:read': '시스템 설정을 조회할 수 있습니다',
  'system:config:update': '시스템 설정을 수정할 수 있습니다',
  'system:logs:read': '시스템 로그를 조회할 수 있습니다',
  'system:backup:create': '백업을 생성할 수 있습니다',
  'system:backup:restore': '백업을 복원할 수 있습니다',
  'announcement:create': '공지사항을 생성할 수 있습니다',
  'announcement:read': '공지사항을 조회할 수 있습니다',
  'announcement:update': '공지사항을 수정할 수 있습니다',
  'announcement:delete': '공지사항을 삭제할 수 있습니다',
  'assessment:create': '평가를 생성할 수 있습니다',
  'assessment:read': '평가를 조회할 수 있습니다',
  'assessment:update': '평가를 수정할 수 있습니다',
  'assessment:delete': '평가를 삭제할 수 있습니다',
  'report:read': '보고서를 조회할 수 있습니다',
  'report:export': '보고서를 내보낼 수 있습니다'
}

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('social_worker')
  const [permissions, setPermissions] = useState<Record<UserRole, Permission[]>>(ROLE_PERMISSIONS)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // 권한 변경 핸들러
  const handlePermissionToggle = (role: UserRole, permission: Permission) => {
    setPermissions(prev => {
      const currentPermissions = prev[role] || []
      const newPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission]
      
      setHasChanges(true)
      return {
        ...prev,
        [role]: newPermissions
      }
    })
  }

  // 카테고리 전체 선택/해제
  const handleCategoryToggle = (role: UserRole, category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES] || []
    const currentPermissions = permissions[role] || []
    const allSelected = categoryPermissions.every(p => currentPermissions.includes(p as Permission))
    
    setPermissions(prev => {
      const newPermissions = allSelected
        ? currentPermissions.filter(p => !categoryPermissions.includes(p as string))
        : [...new Set([...currentPermissions, ...categoryPermissions as Permission[]])]
      
      setHasChanges(true)
      return {
        ...prev,
        [role]: newPermissions
      }
    })
  }

  // 변경사항 저장
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 실제 구현에서는 여기에 백엔드 API 호출
      // await updateRolePermissions(permissions)
      
      // 임시로 localStorage에 저장
      localStorage.setItem('rolePermissions', JSON.stringify(permissions))
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // 시뮬레이션
      
      toast({
        title: '성공',
        description: '권한 설정이 저장되었습니다.',
      })
      
      setHasChanges(false)
    } catch (error) {
      toast({
        title: '오류',
        description: '권한 설정 저장 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // 초기화
  const handleReset = () => {
    setPermissions(ROLE_PERMISSIONS)
    setHasChanges(false)
    toast({
      title: '초기화 완료',
      description: '권한 설정이 기본값으로 초기화되었습니다.',
    })
  }

  // 사용 가능한 역할 목록
  const availableRoles: UserRole[] = [
    'administrator',
    'director', 
    'vice_director',
    'department_head',
    'manager_level',
    'section_chief',
    'assistant_manager',
    'social_worker',
    'staff',
    'attending_physician',
    'patient'
  ]

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">권한 설정</h1>
          <p className="text-gray-600 mt-2">각 역할별 권한을 설정하고 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              <AlertCircle className="w-3 h-3 mr-1" />
              변경사항 있음
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
            <RefreshCw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 역할 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            역할 선택
          </CardTitle>
          <CardDescription>권한을 설정할 역할을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center justify-between w-full">
                    <span>{ROLE_NAMES[role]}</span>
                    <Badge variant="outline" className="ml-2">
                      {permissions[role]?.length || 0}개 권한
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 권한 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {ROLE_NAMES[selectedRole]} 권한 설정
          </CardTitle>
          <CardDescription>
            선택한 역할이 수행할 수 있는 권한을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="category" className="w-full">
            <TabsList>
              <TabsTrigger value="category">카테고리별</TabsTrigger>
              <TabsTrigger value="all">전체 목록</TabsTrigger>
            </TabsList>
            
            <TabsContent value="category" className="space-y-6">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPermissions]) => {
                const currentPermissions = permissions[selectedRole] || []
                const selectedCount = categoryPermissions.filter(p => 
                  currentPermissions.includes(p as Permission)
                ).length
                const allSelected = selectedCount === categoryPermissions.length
                const someSelected = selectedCount > 0 && selectedCount < categoryPermissions.length
                
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onCheckedChange={() => handleCategoryToggle(selectedRole, category)}
                        />
                        {category}
                      </Label>
                      <Badge variant="secondary">
                        {selectedCount} / {categoryPermissions.length}
                      </Badge>
                    </div>
                    
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map(permission => (
                        <div key={permission} className="flex items-start space-x-2">
                          <Checkbox
                            id={permission}
                            checked={currentPermissions.includes(permission as Permission)}
                            onCheckedChange={() => handlePermissionToggle(selectedRole, permission as Permission)}
                          />
                          <div className="space-y-1">
                            <Label
                              htmlFor={permission}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission}
                            </Label>
                            <p className="text-xs text-gray-500">
                              {PERMISSION_DESCRIPTIONS[permission as Permission]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.keys(PERMISSION_DESCRIPTIONS).map(permission => {
                  const currentPermissions = permissions[selectedRole] || []
                  return (
                    <div key={permission} className="flex items-start space-x-2">
                      <Checkbox
                        id={`all-${permission}`}
                        checked={currentPermissions.includes(permission as Permission)}
                        onCheckedChange={() => handlePermissionToggle(selectedRole, permission as Permission)}
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor={`all-${permission}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {PERMISSION_DESCRIPTIONS[permission as Permission]}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 권한 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            권한 요약
          </CardTitle>
          <CardDescription>각 역할별 권한 개수</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableRoles.map(role => {
              const permissionCount = permissions[role]?.length || 0
              const percentage = Math.round((permissionCount / Object.keys(PERMISSION_DESCRIPTIONS).length) * 100)
              
              return (
                <div
                  key={role}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{ROLE_NAMES[role]}</span>
                    {permissionCount > 0 && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold">{permissionCount}</div>
                  <div className="text-xs text-gray-500">권한 ({percentage}%)</div>
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}