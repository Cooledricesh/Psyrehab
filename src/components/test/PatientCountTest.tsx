import { useState, useEffect } from 'react'
import { getPatientCount } from '@/services/dashboardService'

// 테스트용 컴포넌트 - 실제 환자 수를 확인
export function PatientCountTest() {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true)
        const realCount = await getPatientCount()
        setCount(realCount)
        setError(null)
      } catch (err) {
        setError('데이터 로드 실패')
        console.error("Error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [])

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
      <h3 className="font-semibold text-yellow-800 mb-2">🧪 테스트: 실제 환자 수</h3>
      {loading ? (
        <p className="text-yellow-700">로딩 중...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <p className="text-green-700">실제 환자 수: <strong>{count}명</strong></p>
      )}
    </div>
  )
} 