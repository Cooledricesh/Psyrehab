import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export function QuickActions() {

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          빠른 작업
        </CardTitle>
        <CardDescription>
          자주 사용하는 기능들에 빠르게 접근할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">빠른 작업이 없습니다.</p>
      </CardContent>
    </Card>
  )
}