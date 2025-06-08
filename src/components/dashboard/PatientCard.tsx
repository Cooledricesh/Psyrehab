import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PatientGoal {
  id: number
  title: string
  start_date: string
  end_date: string
  status?: string
}

export interface PatientCardProps {
  id: number
  name: string
  birth_date: string
  gender: string
  diagnosis: string
  goals?: PatientGoal[]
  status?: string
}

export const PatientCard = ({
  id,
  name,
  birth_date,
  gender,
  diagnosis,
  goals = [],
  status = 'active'
}: PatientCardProps) => {
  const navigate = useNavigate()

  const handleViewProfile = () => {
    navigate(`/patient-management?patient=${id}`)
  }

  const handleManageGoals = () => {
    navigate(`/goal-setting?patient=${id}`)
  }

  // Calculate age from birth date
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

  const age = calculateAge(birth_date)
  const mainGoal = goals && goals.length > 0 ? goals[0] : null

  const getStatusBadge = (status: string) => {
    const baseStyle = "px-2 py-1 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'active':
        return `${baseStyle} bg-green-100 text-green-800`
      case 'inactive':
        return `${baseStyle} bg-gray-100 text-gray-600`
      case 'completed':
        return `${baseStyle} bg-blue-100 text-blue-800`
      default:
        return `${baseStyle} bg-green-100 text-green-800`
    }
  }

  const statusLabels = {
    active: '활성',
    inactive: '비활성',
    completed: '완료'
  }

  return (
    <div className="bg-white rounded-lg border shadow hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              className="font-bold text-lg text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleViewProfile}
            >
              {name}
            </h3>
            <p className="text-gray-600 text-sm">
              {diagnosis} · {age}세 · {gender}
            </p>
          </div>
          <span className={getStatusBadge(status)}>
            {statusLabels[status as keyof typeof statusLabels] || status}
          </span>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            주요 목표
          </h4>
          <p className="text-gray-900">
            {mainGoal ? mainGoal.title : '설정된 목표가 없습니다'}
          </p>
        </div>

        {mainGoal && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                시작일
              </h4>
              <p className="text-gray-900">
                {format(new Date(mainGoal.start_date), 'yyyy-MM-dd', { locale: ko })}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                목표 종료
              </h4>
              <p className="text-gray-900">
                {format(new Date(mainGoal.end_date), 'yyyy-MM-dd', { locale: ko })}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleViewProfile}
          >
            상세 프로필
          </button>
          <button
            className="flex-1 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            onClick={handleManageGoals}
          >
            목표 관리
          </button>
        </div>
      </div>
    </div>
  )
} 