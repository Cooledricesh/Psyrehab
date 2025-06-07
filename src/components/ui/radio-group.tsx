import React from 'react'
import { cn } from '@/lib/utils'

interface RadioGroupProps {
  value?: string | number
  onValueChange?: (value: string | number) => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string | number
  id?: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface RadioGroupContext {
  value?: string | number
  onValueChange?: (value: string | number) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContext | undefined>(
  undefined
)

const useRadioGroup = () => {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error('useRadioGroup must be used within a RadioGroup')
  }
  return context
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onValueChange,
  disabled = false,
  className,
  children,
}) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <div
        className={cn('grid gap-2', className)}
        role="radiogroup"
        aria-disabled={disabled}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
  value,
  id,
  disabled,
  className,
  children,
}) => {
  const { value: selectedValue, onValueChange, disabled: groupDisabled } = useRadioGroup()
  const itemId = id || `radio-item-${value}`
  const isDisabled = disabled || groupDisabled
  const isChecked = selectedValue === value

  const handleChange = () => {
    if (!isDisabled && onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div
        className={cn(
          'h-4 w-4 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer transition-colors',
          isChecked && 'border-blue-600 bg-blue-600',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleChange}
      >
        {isChecked && (
          <div className="h-2 w-2 rounded-full bg-white" />
        )}
      </div>
      <input
        type="radio"
        id={itemId}
        name={itemId}
        value={value}
        checked={isChecked}
        onChange={handleChange}
        disabled={isDisabled}
        className="sr-only"
      />
      <label
        htmlFor={itemId}
        className={cn(
          'text-sm cursor-pointer',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleChange}
      >
        {children}
      </label>
    </div>
  )
}

export { RadioGroup as Root, RadioGroupItem as Item } 