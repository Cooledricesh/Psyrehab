import { History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { PAST_SUCCESS_OPTIONS } from '../constants'

interface PastSuccessCardProps {
  selectedValues: string[]
  otherValue: string
  onSelectedChange: (value: string, checked: boolean) => void
  onOtherChange: (value: string) => void
}

export function PastSuccessCard({
  selectedValues,
  otherValue,
  onSelectedChange,
  onOtherChange,
}: PastSuccessCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-600" />
          3. 과거 성공 경험 탐색
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Label className="text-base font-medium mb-4 block">
          예전에 꾸준히 잘 했던 일이나 좋아했던 활동이 있나요? (복수 선택 가능)
        </Label>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PAST_SUCCESS_OPTIONS.map((item) => (
              <div key={item.value} className="flex items-center space-x-2">
                <Checkbox
                  id={item.value}
                  checked={selectedValues.includes(item.value)}
                  onCheckedChange={(checked) =>
                    onSelectedChange(item.value, checked as boolean)
                  }
                />
                <Label htmlFor={item.value}>{item.label}</Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-neutral-600">
              기타 성공 경험이 있다면 적어주세요
            </Label>
            <Textarea
              placeholder="예: 특별한 취미나 활동, 자격증 취득 등"
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
