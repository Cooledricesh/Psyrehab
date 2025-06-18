import { Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { getMotivationMessage } from '../constants'

interface MotivationCardProps {
  value: number
  onChange: (value: number[]) => void
}

export function MotivationCard({ value, onChange }: MotivationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          2. 변화 동기 & 의지 수준
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="text-base font-medium mb-4 block">
          지금 새로운 것을 시작하고 싶은 마음이 얼마나 되나요?
        </Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>별로 없음</span>
            <span className="font-medium">{value}점</span>
            <span>매우 많음</span>
          </div>
          <Slider
            value={[value]}
            onValueChange={onChange}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="text-sm text-neutral-600">
            {getMotivationMessage(value)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
