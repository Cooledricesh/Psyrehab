import { Brain } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { FOCUS_TIME_OPTIONS } from '../constants'

interface FocusTimeCardProps {
  value: string
  onChange: (value: string) => void
}

export function FocusTimeCard({ value, onChange }: FocusTimeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          1. 집중력 & 인지 부담 측정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="text-base font-medium mb-4 block">
          한 가지 일에 집중할 수 있는 시간은 얼마나 되나요?
        </Label>
        <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
          {FOCUS_TIME_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
