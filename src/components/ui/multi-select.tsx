import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, X } from 'lucide-react'

interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
  required?: boolean
  maxSelections?: number
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options = [],
  value = [],
  onChange,
  placeholder = '선택해주세요',
  disabled = false,
  className,
  name,
  required = false,
  maxSelections,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOptions = options.filter(option => 
    value.includes(option.value)
  )

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return

    const isSelected = value.includes(optionValue)
    let newValue: string[]

    if (isSelected) {
      // 선택 해제
      newValue = value.filter(v => v !== optionValue)
    } else {
      // 새로 선택
      if (maxSelections && value.length >= maxSelections) {
        return // 최대 선택 수 초과
      }
      newValue = [...value, optionValue]
    }

    onChange?.(newValue)
  }

  const handleRemoveOption = (optionValue: string) => {
    if (disabled) return
    const newValue = value.filter(v => v !== optionValue)
    onChange?.(newValue)
  }

  const handleClearAll = () => {
    if (disabled) return
    onChange?.([])
  }

  return (
    <div className={cn('relative', className)}>
      {/* 선택된 값들 표시 */}
      <div
        className={cn(
          'min-h-[40px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          isOpen && 'ring-2 ring-blue-500 border-transparent'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveOption(option.value)
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearAll()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown 
              size={16} 
              className={cn(
                'text-gray-400 transition-transform',
                isOpen && 'transform rotate-180'
              )} 
            />
          </div>
        </div>
      </div>

      {/* 드롭다운 옵션들 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">
              선택할 수 있는 옵션이 없습니다
            </div>
          ) : (
            options.map((option) => {
              const isSelected = value.includes(option.value)
              const isDisabled = option.disabled || 
                (maxSelections && !isSelected && value.length >= maxSelections)

              return (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm cursor-pointer',
                    'hover:bg-gray-100',
                    isSelected && 'bg-blue-50 text-blue-700',
                    isDisabled && 'opacity-50 cursor-not-allowed bg-gray-50'
                  )}
                  onClick={() => !isDisabled && handleToggleOption(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 최대 선택 수 표시 */}
      {maxSelections && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length}/{maxSelections} 선택됨
        </div>
      )}

      {/* 숨겨진 input들 (폼 제출용) */}
      {name && value.map((val, index) => (
        <input
          key={index}
          type="hidden"
          name={`${name}[]`}
          value={val}
        />
      ))}

      {/* 필수 필드 검증용 숨겨진 input */}
      {name && required && (
        <input
          type="hidden"
          name={name}
          value={value.length > 0 ? 'valid' : ''}
          required={required}
        />
      )}

      {/* 바깥 클릭시 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 