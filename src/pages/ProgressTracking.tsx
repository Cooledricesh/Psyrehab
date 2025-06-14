import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronRight, 
  ChevronDown, 
  Target, 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
  Activity
} from 'lucide-react';
import { 
  useActivePatients, 
  usePatientGoals, 
  useProgressStats,
  useWeeklyCheckIns 
} from '@/hooks/queries/useProgressTracking';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { eventBus, EVENTS } from '@/lib/eventBus';
import { useQueryClient } from '@tanstack/react-query';
import SimpleWeeklyCheckbox from '@/components/progress/SimpleWeeklyCheckbox';
import { cn } from '@/lib/utils';

export default function ProgressTracking() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  // 데이터 조회
  const { data: patients, isLoading: patientsLoading } = useActivePatients();
  const { data: patientGoals, isLoading: goalsLoading } = usePatientGoals(selectedPatient);
  const { data: stats, isLoading: statsLoading } = useProgressStats();

  // 환자 상태 변경 이벤트 리스너
  useEffect(() => {
    const handlePatientStatusChanged = (data: { patientId: string; newStatus: string }) => {
      console.log('진행 추적: 환자 상태 변경 감지:', data);
      // 관련 쿼리들 새로고침
      queryClient.invalidateQueries({ queryKey: ['activePatients'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['patientGoals'] });
    };

    eventBus.on(EVENTS.PATIENT_STATUS_CHANGED, handlePatientStatusChanged);

    return () => {
      eventBus.off(EVENTS.PATIENT_STATUS_CHANGED, handlePatientStatusChanged);
    };
  }, [queryClient]);

  // 첫 번째 환자 자동 선택
  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0].id);
    }
  }, [patients, selectedPatient]);

  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '진행중', variant: 'default' as const },
      completed: { label: '완료', variant: 'success' as const },
      pending: { label: '대기중', variant: 'secondary' as const },
      on_hold: { label: '보류', variant: 'warning' as const },
      cancelled: { label: '취소', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColorByProgress = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">진행 추적</h1>
        <p className="text-gray-600">회원 별 목표 달성 진행상황</p>
      </header>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 평균 진행률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {statsLoading ? '...' : `${stats?.averageProgress.toFixed(1)}%`}
              </span>
              {stats && getTrendIcon(stats.trend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              목표 달성률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : `${stats?.achievementRate.toFixed(1)}%`}
              </span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              참여 활성도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-purple-600">
                {statsLoading ? '...' : `${stats?.participationRate.toFixed(1)}%`}
              </span>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              진행 중인 회원 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {patientsLoading ? '...' : patients?.length || 0}
              </span>
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 환자 목록 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>목표 진행 중</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {patientsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  환자 목록을 불러오는 중...
                </div>
              ) : patients && patients.length > 0 ? (
                <div className="space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPatient === patient.id
                          ? 'bg-blue-50 border-blue-500 shadow-md'
                          : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{patient.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        담당: {patient.social_workers?.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {patient.diagnosis}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  활성 상태의 회원이 없습니다.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 목표 계층 구조 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>목표 계층 구조</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              goalsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  목표를 불러오는 중...
                </div>
              ) : patientGoals ? (
                <div className="space-y-4">
                  {/* 6개월 목표 */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">6개월 목표</h3>
                      </div>
                      {getStatusBadge(patientGoals.sixMonthGoal.status)}
                    </div>
                    <p className="text-sm mb-2">{patientGoals.sixMonthGoal.title}</p>
                    {patientGoals.sixMonthGoal.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {patientGoals.sixMonthGoal.description}
                      </p>
                    )}
                    <Progress 
                      value={patientGoals.sixMonthGoal.progress || 0} 
                      className="h-2"
                      indicatorClassName={getProgressColor(patientGoals.sixMonthGoal.progress || 0)}
                    />
                  </div>

                  {/* 월간 목표들 */}
                  <div className="space-y-3">
                    {patientGoals.monthlyGoals.map((monthlyGoal) => (
                      <div key={monthlyGoal.id} className="border rounded-lg p-3 space-y-2">
                        <button
                          onClick={() => toggleGoalExpansion(monthlyGoal.id)}
                          className="w-full"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 text-left">
                              {expandedGoals[monthlyGoal.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className={`font-medium text-sm ${
                                monthlyGoal.status === 'completed' 
                                  ? getTextColorByProgress(monthlyGoal.progress || 0)
                                  : ''
                              }`}>
                                {monthlyGoal.sequence_number}개월차: {monthlyGoal.title}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {monthlyGoal.status === 'completed' ? (
                                <span className={cn(
                                  "text-xs font-medium",
                                  getTextColorByProgress(monthlyGoal.progress || 0)
                                )}>
                                  달성률: {monthlyGoal.progress || 0}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {monthlyGoal.weeklyGoals?.filter(
                                    w => w.status === 'completed' || w.status === 'cancelled'
                                  ).length || 0}/{monthlyGoal.weeklyGoals?.length || 0}주
                                </span>
                              )}
                              {getStatusBadge(monthlyGoal.status)}
                            </div>
                          </div>
                        </button>
                        
                        {/* 접힌 상태에서도 완료된 목표는 Progress 바 표시 */}
                        {!expandedGoals[monthlyGoal.id] && monthlyGoal.status === 'completed' && (
                          <div className="ml-6 mr-2">
                            <Progress 
                              value={monthlyGoal.progress || 0} 
                              className="h-2"
                              indicatorClassName={getProgressColor(monthlyGoal.progress || 0)}
                            />
                          </div>
                        )}

                        {expandedGoals[monthlyGoal.id] && (
                          <div className="mt-3 space-y-2">
                            {/* 펼쳤을 때도 완료된 목표는 Progress 바 표시 */}
                            {monthlyGoal.status === 'completed' && (
                              <div className="ml-6">
                                <Progress 
                                  value={monthlyGoal.progress || 0} 
                                  className="h-2"
                                  indicatorClassName={getProgressColor(monthlyGoal.progress || 0)}
                                />
                              </div>
                            )}
                            
                            {/* 주간 목표들 */}
                            <div className="ml-6 space-y-2">
                              {monthlyGoal.weeklyGoals?.map((weeklyGoal) => (
                                <div
                                  key={weeklyGoal.id}
                                  className="p-2 bg-gray-50 rounded"
                                >
                                  <SimpleWeeklyCheckbox
                                    weeklyGoal={weeklyGoal}
                                    patientId={selectedPatient!}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  이 환자의 활성 목표가 없습니다.
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                환자를 선택해주세요.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}