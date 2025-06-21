import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Users,
  Calendar,
  Target
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  status: 'active' | 'inactive' | 'completed'
  goals: number
  completed: number
  lastSession: string
  progress: number
  assignedWorker: string
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: '김철수',
    age: 45,
    status: 'active',
    goals: 5,
    completed: 3,
    lastSession: '2024-01-15',
    progress: 75,
    assignedWorker: '이사회복지사'
  },
  {
    id: '2',
    name: '박영희',
    age: 38,
    status: 'active',
    goals: 4,
    completed: 2,
    lastSession: '2024-01-14',
    progress: 60,
    assignedWorker: '김정신보건사'
  },
  {
    id: '3',
    name: '이민수',
    age: 52,
    status: 'completed',
    goals: 6,
    completed: 6,
    lastSession: '2024-01-10',
    progress: 100,
    assignedWorker: '이사회복지사'
  },
  {
    id: '4',
    name: '최수진',
    age: 29,
    status: 'active',
    goals: 3,
    completed: 1,
    lastSession: '2024-01-16',
    progress: 40,
    assignedWorker: '박심리상담사'
  },
  {
    id: '5',
    name: '정대호',
    age: 61,
    status: 'inactive',
    goals: 4,
    completed: 1,
    lastSession: '2024-01-05',
    progress: 25,
    assignedWorker: '김정신보건사'
  }
]

export function PatientsDataTable() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 실제 환경에서는 API에서 데이터를 가져옴
    setTimeout(() => {
      setPatients(mockPatients)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.assignedWorker.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Patient['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">비활성</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">완료</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-blue-600'
    if (progress >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>환자 목록</CardTitle>
          <CardDescription>등록된 환자들의 상세 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col space-y-1.5 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              환자 목록
            </CardTitle>
            <CardDescription>
              총 {patients.length}명의 환자가 등록되어 있습니다
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Button size="sm">
              환자 추가
            </Button>
          </div>
        </div>
        
        {/* 필터 및 검색 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="환자명 또는 담당자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive', 'completed'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? '전체' :
                 status === 'active' ? '활성' :
                 status === 'inactive' ? '비활성' : '완료'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>환자명</TableHead>
                <TableHead>나이</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>목표 진행</TableHead>
                <TableHead>완료율</TableHead>
                <TableHead>마지막 세션</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    검색 조건에 맞는 환자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}세</TableCell>
                    <TableCell>{getStatusBadge(patient.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span>{patient.completed}/{patient.goals}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${patient.progress}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getProgressColor(patient.progress)}`}>
                          {patient.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(patient.lastSession).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>{patient.assignedWorker}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">메뉴 열기</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>작업</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            정보수정
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Target className="mr-2 h-4 w-4" />
                            목표관리
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            보고서 생성
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* 테이블 하단 통계 */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {patients.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500">활성 환자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(patients.reduce((acc, p) => acc + p.progress, 0) / patients.length)}%
              </div>
              <div className="text-sm text-gray-500">평균 진행률</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {patients.reduce((acc, p) => acc + p.completed, 0)}
              </div>
              <div className="text-sm text-gray-500">완료된 목표</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {patients.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">완료된 환자</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}