import React, { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Chart UI components removed - using basic recharts
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, TrendingUp } from 'lucide-react'

const chartData = [
  { month: '1월', completed: 45, active: 120, total: 165 },
  { month: '2월', completed: 52, active: 135, total: 187 },
  { month: '3월', completed: 48, active: 142, total: 190 },
  { month: '4월', completed: 61, active: 158, total: 219 },
  { month: '5월', completed: 69, active: 165, total: 234 },
  { month: '6월', completed: 74, active: 172, total: 246 },
  { month: '7월', completed: 82, active: 185, total: 267 },
  { month: '8월', completed: 88, active: 192, total: 280 },
  { month: '9월', completed: 95, active: 205, total: 300 },
  { month: '10월', completed: 102, active: 218, total: 320 },
  { month: '11월', completed: 110, active: 225, total: 335 },
  { month: '12월', completed: 118, active: 232, total: 350 }
]


export function ProgressChart() {
  const [timeRange, setTimeRange] = useState('12개월')

  const filteredData = timeRange === '6개월' 
    ? chartData.slice(-6) 
    : timeRange === '3개월'
    ? chartData.slice(-3)
    : chartData

  const totalCompleted = chartData[chartData.length - 1].completed
  const totalActive = chartData[chartData.length - 1].active
  const completionRate = Math.round((totalCompleted / (totalCompleted + totalActive)) * 100)
  const growthRate = Math.round(((chartData[chartData.length - 1].total - chartData[0].total) / chartData[0].total) * 100)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            재활 목표 진행 현황
          </CardTitle>
          <CardDescription>
            월별 목표 완료 및 진행 상황을 보여줍니다
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Badge variant={completionRate >= 35 ? "default" : "secondary"}>
              완료율 {completionRate}%
            </Badge>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              성장률 +{growthRate}%
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
        <div className="aspect-auto h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#8b5cf6"
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
                tickFormatter={(value) => `${value}`}
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
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                dataKey="total"
                type="natural"
                fill="url(#fillTotal)"
                fillOpacity={0.4}
                stroke="#8b5cf6"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="active"
                type="natural"
                fill="url(#fillActive)"
                fillOpacity={0.4}
                stroke="#3b82f6"
                strokeWidth={2}
                stackId="b"
              />
              <Area
                dataKey="completed"
                type="natural"
                fill="url(#fillCompleted)"
                fillOpacity={0.4}
                stroke="#10b981"
                strokeWidth={2}
                stackId="c"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* 차트 하단 통계 */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">완료된 목표</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
            <div className="text-xs text-gray-500">누적 달성 목표</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">진행중인 목표</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalActive}</div>
            <div className="text-xs text-gray-500">현재 활성 목표</div>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-medium">전체 성과</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-xs text-gray-500">목표 완료율</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}