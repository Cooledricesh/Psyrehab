import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { CONSTRAINT_OPTIONS } from '../constants'

interface ConstraintsCardProps {
  selectedValues: string[]
  otherValue: string
  onSelectedChange: (value: string, checked: boolean) => void
  onOtherChange: (value: string) => void
}

export function ConstraintsCard({
  selectedValues,
  otherValue,
  onSelectedChange,
  onOtherChange,
}: ConstraintsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          4. 환경적 제약 사항
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="text-base font-medium mb-4 block">
          다음 중 목표 실행에 어려움이 될 수 있는 것은? (복수 선택 가능)
        </Label>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CONSTRAINT_OPTIONS.map((item) => (
              <div key={item.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`constraint-${item.value}`}
                  checked={selectedValues.includes(item.value)}
                  onCheckedChange={(checked) =>
                    onSelectedChange(item.value, checked as boolean)
                  }
                />
                <Label htmlFor={`constraint-${item.value}`}>{item.label}</Label>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="constraintsOther">기타 제약사항 (직접 입력)</Label>
            <Textarea
              id="constraintsOther"
              placeholder="예: 약물 부작용, 집중력 부족, 기타 개인적 제약사항"
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
