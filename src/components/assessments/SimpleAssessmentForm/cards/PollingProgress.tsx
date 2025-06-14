import { Loader2 } from 'lucide-react'
import { getPollingStatus } from '../utils'

interface PollingProgressProps {
  current: number
  max: number
}

export function PollingProgress({ current, max }: PollingProgressProps) {
  const { remainingTime, progressPercentage } = getPollingStatus(current, max)
  const remainingMinutes = Math.ceil(remainingTime / 60)

  return (
    <div className="w-full mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="font-medium text-blue-800">AI 분석 진행 중...</span>
      </div>
      <div className="text-sm text-blue-600 mb-2">
        개인맞춤형 목표를 생성하고 있습니다.
        {max > 0 && (
          <span>
            ({current}/{max} - 예상 대기시간: {remainingMinutes}분)
          </span>
        )}
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: max > 0 ? `${progressPercentage}%` : '20%',
          }}
        />
      </div>
    </div>
  )
}
