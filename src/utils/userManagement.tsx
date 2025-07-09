import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'

// 직급별 역할 정의 (social_workers 테이블에 저장되는 역할들)
export const jobTitleRoles = [
  'staff', 
  'assistant_manager', 
  'section_chief', 
  'manager_level', 
  'department_head', 
  'vice_director', 
  'director', 
  'attending_physician'
] as const

// 사용자가 어떤 테이블에 속하는지 확인
export const getUserTable = (role: string): 'social_workers' | 'administrators' => {
  return jobTitleRoles.includes(role) ? 'social_workers' : 'administrators'
}

// 역할별 배지 표시
export const getRoleBadge = (role: string) => {
  const badges: Record<string, React.ReactElement> = {
    // social_worker는 이제 사용하지 않음
    administrator: <Badge className="bg-purple-100 text-purple-800">관리자</Badge>,
    patient: <Badge className="bg-green-100 text-green-800">환자</Badge>,
    pending: <Badge className="bg-yellow-100 text-yellow-800">승인 대기</Badge>,
    staff: <Badge className="bg-gray-100 text-gray-800">사원</Badge>,
    assistant_manager: <Badge className="bg-indigo-100 text-indigo-800">주임</Badge>,
    section_chief: <Badge className="bg-cyan-100 text-cyan-800">계장</Badge>,
    manager_level: <Badge className="bg-blue-100 text-blue-800">과장</Badge>,
    department_head: <Badge className="bg-teal-100 text-teal-800">부장</Badge>,
    vice_director: <Badge className="bg-orange-100 text-orange-800">부원장</Badge>,
    director: <Badge className="bg-red-100 text-red-800">원장</Badge>,
    attending_physician: <Badge className="bg-pink-100 text-pink-800">주치의</Badge>
  }
  return badges[role] || <Badge>{role}</Badge>
}

// 활성 상태 배지 표시
export const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge variant="outline" className="text-green-600 border-green-600">
      <CheckCircle className="w-3 h-3 mr-1" />
      활성
    </Badge>
  ) : (
    <Badge variant="outline" className="text-gray-500 border-gray-500">
      <XCircle className="w-3 h-3 mr-1" />
      비활성
    </Badge>
  )
}