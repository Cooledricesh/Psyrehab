import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">테스트 페이지</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>컴포넌트 테스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="mb-2">Button 컴포넌트:</p>
              <Button>테스트 버튼</Button>
            </div>
            
            <div>
              <p className="mb-2">Badge 컴포넌트:</p>
              <Badge>테스트 뱃지</Badge>
            </div>
            
            <div>
              <p className="mb-2">기본 스타일:</p>
              <div className="p-4 bg-blue-100 rounded-lg">
                <p className="text-blue-800">스타일이 제대로 적용되나요?</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 