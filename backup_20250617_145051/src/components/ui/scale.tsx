import React from 'react'
import { cn } from '@/lib/utils'

interface ScaleProps {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  labels?: { value: number; label: string }[]
  disabled?: boolean
  className?: string
  name?: string
  required?: boolean
}

export const Scale: React.FC<ScaleProps> = ({
  value,
  onChange,
  min = 1,
  max = 5,
  labels = [],
  disabled = false,
  className,
  name,
  required = false,
}) => {
  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  const handleClick = (scaleValue: number) => {
    if (!disabled && onChange) {
      onChange(scaleValue)
    }
  }

  const getLabelForValue = (scaleValue: number) => {
    const label = labels.find(l => l.value === scaleValue)
    return label?.label || scaleValue.toString()
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 스케일 버튼들 */}
      <div className="flex items-center gap-2">
        {scaleValues.map((scaleValue) => {
          const isSelected = value === scaleValue
          
          return (
            <button
              key={scaleValue}
              type="button"
              onClick={() => handleClick(scaleValue)}
              disabled={disabled}
              className={cn(
                'w-10 h-10 rounded-full border-2 font-medium text-sm transition-colors',
                'hover:scale-105 active:scale-95',
                isSelected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
              aria-pressed={isSelected}
              aria-label={`${scaleValue}점: ${getLabelForValue(scaleValue)}`}
            >
              {scaleValue}
            </button>
          )
        })}
      </div>

      {/* 라벨 표시 */}
      {labels.length > 0 && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>{getLabelForValue(min)}</span>
          {labels.length > 2 && (
            <span className="text-center">{getLabelForValue(Math.ceil((min + max) / 2))}</span>
          )}
          <span>{getLabelForValue(max)}</span>
        </div>
      )}

      {/* 선택된 값 설명 */}
      {value && (
        <div className="text-sm text-blue-600 font-medium">
          선택됨: {value}점 - {getLabelForValue(value)}
        </div>
      )}

      {/* 숨겨진 input (폼 제출용) */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ''}
          required={required}
        />
      )}
    </div>
  )
}

// 일반적인 5점 스케일 라벨
export const defaultScaleLabels = [
  { value: 1, label: '매우 낮음' },
  { value: 2, label: '낮음' },
  { value: 3, label: '보통' },
  { value: 4, label: '높음' },
  { value: 5, label: '매우 높음' },
]

// 만족도 스케일 라벨
export const satisfactionScaleLabels = [
  { value: 1, label: '매우 불만족' },
  { value: 2, label: '불만족' },
  { value: 3, label: '보통' },
  { value: 4, label: '만족' },
  { value: 5, label: '매우 만족' },
]

// 동의도 스케일 라벨
export const agreementScaleLabels = [
  { value: 1, label: '전혀 동의하지 않음' },
  { value: 2, label: '동의하지 않음' },
  { value: 3, label: '보통' },
  { value: 4, label: '동의함' },
  { value: 5, label: '매우 동의함' },
] 