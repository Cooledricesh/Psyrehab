import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: {
    value: string | number
    positive: boolean
  }
  secondaryText?: string
  iconBgColor: string
  iconColor: string
  isLoading?: boolean
}

export const StatCard = ({
  title,
  value,
  icon,
  change,
  secondaryText,
  iconBgColor,
  iconColor,
  isLoading = false,
}: StatCardProps) => {
  return (
    <Card className="stat-card card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-muted-foreground font-medium">{title}</h3>
          <span className={`stat-icon ${iconBgColor} ${iconColor}`}>
            {icon}
          </span>
        </div>
        <div className="flex items-end">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <span className="text-3xl font-bold text-foreground">
                {value}
              </span>
              {secondaryText && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {secondaryText}
                </span>
              )}
              {change && (
                <span
                  className={`ml-2 text-sm ${
                    change.positive ? 'text-success' : 'text-destructive'
                  } flex items-center`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={
                        change.positive
                          ? 'M5 10l7-7m0 0l7 7m-7-7v18'
                          : 'M19 14l-7 7m0 0l-7-7m7 7V3'
                      }
                    />
                  </svg>
                  {change.value}
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 