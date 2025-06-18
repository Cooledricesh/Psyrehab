import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { SOCIAL_PREFERENCE_OPTIONS } from '../constants'

interface SocialPreferenceCardProps {
  value: string
  onChange: (value: string) => void
}

export function SocialPreferenceCard({ value, onChange }: SocialPreferenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          5. 사회적 활동 선호도
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="text-base font-medium mb-4 block">
          사람들과 함께 하는 활동에 대해 어떻게 생각하세요?
        </Label>
        <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
          {SOCIAL_PREFERENCE_OPTIONS.map((option) => (
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
