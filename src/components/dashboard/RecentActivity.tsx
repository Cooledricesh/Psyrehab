import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock, Target, FileText, User } from 'lucide-react'

interface RecentActivity {
  id: string
  patient: string
  activity: string
  date: string
  type: 'goal' | 'session' | 'report' | 'assessment'
}

interface RecentActivityProps {
  activities: RecentActivity[]
  isLoading?: boolean
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'goal':
      return <Target className="h-4 w-4" />
    case 'session':
      return <Clock className="h-4 w-4" />
    case 'report':
      return <FileText className="h-4 w-4" />
    case 'assessment':
      return <User className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getActivityTypeLabel = (type: string) => {
  const labels = {
    goal: '목표',
    session: '세션',
    report: '보고서',
    assessment: '평가'
  }
  return labels[type as keyof typeof labels] || type
}

const getActivityTypeBadge = (type: string) => {
  const variants = {
    goal: 'bg-primary/20 text-primary',
    session: 'bg-secondary/20 text-secondary',
    report: 'bg-accent/20 text-accent',
    assessment: 'bg-success/20 text-success'
  }
  
  return variants[type as keyof typeof variants] || variants.session
}

export const RecentActivity = ({ activities, isLoading = false }: RecentActivityProps) => {
  if (isLoading) {
    return (
      <Card className="stat-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="stat-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">최근 활동</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            최근 활동이 없습니다
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`stat-icon ${getActivityTypeBadge(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.patient}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActivityTypeBadge(activity.type)}`}
                    >
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {activity.activity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.date), 'MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 