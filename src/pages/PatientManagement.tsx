import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface Patient {
  id: string
  name: string
  age?: number
  birth_date?: string
  gender?: string
  diagnosis: string
  registration_date?: string
  created_at?: string
  status: 'active' | 'inactive' | 'completed'
}

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      // Try to fetch from Supabase with basic query first
      const { data, error } = await supabase
        .from('patients')
        .select('*')

      if (error) {
        console.error('Error fetching patients:', error)
        setError('환자 데이터를 가져오는데 실패했습니다.')
        
        // Use fallback mock data
        setPatients([
          {
            id: '1',
            name: '김○○',
            age: 28,
            diagnosis: '조현병',
            registration_date: '2024-01-15',
            status: 'active'
          },
          {
            id: '2',
            name: '이○○',
            age: 34,
            diagnosis: '양극성 장애',
            registration_date: '2024-02-20',
            status: 'active'
          },
          {
            id: '3',
            name: '박○○',
            age: 31,
            diagnosis: '우울증',
            registration_date: '2024-03-10',
            status: 'inactive'
          },
          {
            id: '4',
            name: '최○○',
            age: 25,
            diagnosis: '사회불안장애',
            registration_date: '2024-03-25',
            status: 'active'
          }
        ])
      } else if (data && data.length > 0) {
        // Process real data and ensure proper format
        const processedData = data.map(patient => ({
          id: patient.id?.toString() || '',
          name: patient.name || '이름 없음',
          age: patient.age || (patient.birth_date ? calculateAge(patient.birth_date) : undefined),
          diagnosis: patient.diagnosis || '진단 없음',
          registration_date: patient.registration_date || patient.created_at || new Date().toISOString().split('T')[0],
          status: patient.status || 'active'
        }))
        
        // Sort by registration_date if available, otherwise by id
        processedData.sort((a, b) => {
          const dateA = new Date(a.registration_date || '1900-01-01')
          const dateB = new Date(b.registration_date || '1900-01-01')
          return dateB.getTime() - dateA.getTime()
        })
        
        setPatients(processedData)
        setError(null)
      } else {
        // No data but no error - show empty state
        setPatients([])
        setError(null)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('데이터를 가져오는 중 오류가 발생했습니다.')
      
      // Use fallback mock data
      setPatients([
        {
          id: '1',
          name: '김○○',
          age: 28,
          diagnosis: '조현병',
          registration_date: '2024-01-15',
          status: 'active'
        },
        {
          id: '2',
          name: '이○○',
          age: 34,
          diagnosis: '양극성 장애',
          registration_date: '2024-02-20',
          status: 'active'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDifference = today.getMonth() - birth.getMonth()
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '활성', class: 'bg-green-100 text-green-800' },
      inactive: { label: '비활성', class: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '완료', class: 'bg-blue-100 text-blue-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">환자 관리</h1>
          <p className="text-gray-600">등록된 환자들을 관리하고 정보를 확인하세요</p>
        </header>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">환자 목록</h2>
              <Button>+ 새 환자 등록</Button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">데이터를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <p className="text-sm text-gray-500">
                  아래는 개발용 샘플 데이터입니다.
                </p>
              </div>
            ) : null}
            
            {patients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">이름</th>
                      <th className="text-left py-3 px-4">나이</th>
                      <th className="text-left py-3 px-4">진단</th>
                      <th className="text-left py-3 px-4">등록일</th>
                      <th className="text-left py-3 px-4">상태</th>
                      <th className="text-left py-3 px-4">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{patient.name}</td>
                        <td className="py-3 px-4">
                          {patient.age ? `${patient.age}세` : '나이 정보 없음'}
                        </td>
                        <td className="py-3 px-4">{patient.diagnosis}</td>
                        <td className="py-3 px-4">
                          {patient.registration_date || '날짜 정보 없음'}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(patient.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">상세보기</Button>
                            <Button variant="outline" size="sm">편집</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">등록된 환자가 없습니다.</p>
                <Button>첫 번째 환자 등록하기</Button>
              </div>
            )}
          </div>
        </div>
    </div>
  )
} 