import React, { useState, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Chart UI components removed - using basic recharts
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, TrendingUp, Users } from 'lucide-react'
import { getMonthlyPatientTrend } from '@/services/dashboard-stats'

interface MonthlyData {
  month: string
  patients: number
  newPatients: number
}

export function ProgressChart() {
  const [timeRange, setTimeRange] = useState('3개월')
  const [chartData, setChartData] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const monthsMap = {
          '3개월': 3,
          '6개월': 6,
          '12개월': 12
        }
        const months = monthsMap[timeRange as keyof typeof monthsMap] || 3
        const data = await getMonthlyPatientTrend(months)
        setChartData(data)
      } catch (error) {
        console.error('Failed to fetch monthly patient trend:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  const filteredData = chartData

  const currentPatients = chartData.length > 0 ? chartData[chartData.length - 1].patients : 0
  const firstMonthPatients = chartData.length > 0 ? chartData[0].patients : 0
  const growthRate = firstMonthPatients > 0 
    ? Math.round(((currentPatients - firstMonthPatients) / firstMonthPatients) * 100)
    : 0
  
  const totalNewPatients = chartData.reduce((sum, data) => sum + data.newPatients, 0)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            총 회원수 변화 추이
          </CardTitle>
          <CardDescription>
            월별 전체 회원수 변화를 보여줍니다
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Badge variant="default">
              현재 {currentPatients}명
            </Badge>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </Badge>
          </div>
          <div className="flex gap-1">
            {['3개월', '6개월', '12개월'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="h-8 px-3 text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="aspect-auto h-[400px] w-full flex items-center justify-center">
            <div className="text-gray-500">데이터를 불러오는 중...</div>
          </div>
        ) : (
          <div className="aspect-auto h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="fillPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#3b82f6"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillNewPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#10b981"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}명`}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="font-medium">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color }}>
                              {entry.name}: {entry.value}명
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  dataKey="patients"
                  type="natural"
                  fill="url(#fillPatients)"
                  fillOpacity={0.4}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="전체 환자수"
                />
                <Area
                  dataKey="newPatients"
                  type="natural"
                  fill="url(#fillNewPatients)"
                  fillOpacity={0.4}
                  stroke="#10b981"
                  strokeWidth={2}
                  name="신규 환자수"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 차트 하단 통계 */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">현재 회원수</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{currentPatients}명</div>
            <div className="text-xs text-gray-500">마지막 월 기준</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">증가율</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </div>
            <div className="text-xs text-gray-500">첫 달 대비 증가율</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">신규 회원</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{totalNewPatients}명</div>
            <div className="text-xs text-gray-500">기간 내 신규 등록</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}