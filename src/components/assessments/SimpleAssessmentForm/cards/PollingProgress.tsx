import { Loader2 } from 'lucide-react'
import { getPollingStatus } from '../utils'

interface PollingProgressProps {
  current: number
  max: number
  isExtendedPolling?: boolean
}

export function PollingProgress({ current, max, isExtendedPolling = false }: PollingProgressProps) {
  const { remainingTime, progressPercentage } = getPollingStatus(current, max)
  const remainingMinutes = Math.ceil(remainingTime / 60)

  return (
    <div className={`w-full mb-4 p-4 border rounded-lg ${
      isExtendedPolling 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className={`h-5 w-5 animate-spin ${
          isExtendedPolling ? 'text-amber-600' : 'text-blue-600'
        }`} />
        <span className={`font-medium ${
          isExtendedPolling ? 'text-amber-800' : 'text-blue-800'
        }`}>
          {isExtendedPolling ? 'AI 분석 연장 중...' : 'AI 분석 진행 중...'}
        </span>
      </div>
      <div className={`text-sm mb-2 ${
        isExtendedPolling ? 'text-amber-600' : 'text-blue-600'
      }`}>
        {isExtendedPolling 
          ? '최적의 목표를 찾기 위해 추가 시간이 필요합니다.'
          : '개인맞춤형 목표를 생성하고 있습니다.'
        }
        {max > 0 && (
          <span>
            ({current}/{max} - 예상 대기시간: {remainingMinutes}분)
          </span>
        )}
      </div>
      <div className={`w-full rounded-full h-2 ${
        isExtendedPolling ? 'bg-amber-200' : 'bg-blue-200'
      }`}>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isExtendedPolling ? 'bg-amber-600' : 'bg-blue-600'
          }`}
          style={{
            width: max > 0 ? `${progressPercentage}%` : '20%',
          }}
        />
      </div>
    </div>
  )
}
