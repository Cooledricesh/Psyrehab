import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Scale } from '@/components/ui/scale'
import { MultiSelect } from '@/components/ui/multi-select'
import { shouldRenderField, getFieldOptions } from '@/lib/assessment-utils'
import type { AssessmentFieldConfig, AssessmentData, AssessmentStep } from '@/types/assessment'
import { cn } from '@/lib/utils'

interface DynamicFieldProps {
  field: AssessmentFieldConfig
  value: unknown
  stepData: unknown
  formData: Partial<AssessmentData>
  currentStepKey: AssessmentStep
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
}

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  stepData,
  formData,
  currentStepKey,
  onChange,
  error,
  disabled = false
}) => {
  if (!shouldRenderField(field, stepData, formData)) {
    return null
  }

  const fieldOptions = getFieldOptions(field, stepData, formData)
  const hasError = !!error

  const baseProps = {
    name: field.id,
    required: field.required,
    disabled
  }

  const renderFieldContent = () => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            {...baseProps}
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => {
              const newValue = field.type === 'number' ? Number(e.target.value) : e.target.value
              onChange(newValue)
            }}
            min={field.min}
            max={field.max}
            step={field.step}
            className={cn(hasError && 'border-red-500')}
          />
        )

      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            id={field.id}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(hasError && 'border-red-500')}
            rows={3}
          />
        )

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={onChange}
            disabled={disabled}
            className={cn(hasError && 'border border-red-500 rounded-md p-3')}
          >
            {fieldOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <RadioGroupItem 
                  value={option.value} 
                  id={`${field.id}-${option.value}`}
                  className="mt-1"
                />
                <Label htmlFor={`${field.id}-${option.value}`} className="cursor-pointer flex-1">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'scale':
        return (
          <Scale
            value={value}
            onChange={onChange}
            min={field.min}
            max={field.max}
            labels={fieldOptions}
            disabled={disabled}
            className={cn(hasError && 'border border-red-500 rounded-md p-3')}
          />
        )

      case 'multiselect':
        return (
          <MultiSelect
            options={fieldOptions.map(opt => ({
              value: opt.value.toString(),
              label: opt.label
            }))}
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder || "선택해주세요"}
            disabled={disabled}
            className={cn(hasError && 'border-red-500')}
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  if (field.type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderFieldContent()}
        {hasError && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={field.id} 
        className={cn(
          field.required && 'after:content-["*"] after:text-red-500 after:ml-1',
          'block text-sm font-medium text-gray-700'
        )}
      >
        {field.label}
      </Label>
      {renderFieldContent()}
      {hasError && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default DynamicField 