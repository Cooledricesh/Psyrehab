import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Loader2,
  Target,
  TreeDeciduous,
  Wand2
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  BaseGoal, 
  SixMonthGoal, 
  MonthlyGoal,
  CreateGoalRequest
} from '@/types/goals';
import GoalBreakdownService, { 
  BreakdownConfig, 
  BreakdownResult 
} from '@/services/goalBreakdownService';
import { useCreateGoal } from '@/hooks/useGoals';
import { GoalStatusBadge } from './GoalStatusBadge';

interface GoalBreakdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SixMonthGoal | MonthlyGoal;
  onSuccess?: () => void;
}

export const GoalBreakdownDialog: React.FC<GoalBreakdownDialogProps> = ({
  isOpen,
  onClose,
  goal,
  onSuccess
}) => {
  const [config, setConfig] = useState<BreakdownConfig>({
    includeBufferTime: false,
    distributeProgressEvenly: true,
    preserveOriginalDates: true,
    customMonthCount: 6,
    customWeekCount: 4
  });

  const [breakdownResult, setBreakdownResult] = useState<BreakdownResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  const createGoalMutation = useCreateGoal();

  // 목표 유형에 따른 설정
  const isSixMonthGoal = goal.goal_type === 'six_month';
  const targetGoalType = isSixMonthGoal ? 'monthly' : 'weekly';

  // 스마트 제안 생성
  const smartSuggestions = GoalBreakdownService.generateSmartBreakdownSuggestions(goal);

  // 분해 실행
  const generateBreakdown = async () => {
    setIsGenerating(true);
    try {
      let result: BreakdownResult;
      
      if (isSixMonthGoal) {
        result = GoalBreakdownService.breakdownSixMonthGoal(goal as SixMonthGoal, config);
      } else {
        result = GoalBreakdownService.breakdownMonthlyGoal(goal as MonthlyGoal, config);
      }

      setBreakdownResult(result);
      
      if (result.success) {
        setActiveTab('preview');
        toast.success('목표 분해가 완료되었습니다');
      } else {
        toast.error('목표 분해에 실패했습니다');
      }
    } catch {
      toast.error('분해 처리 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // 분해 결과 저장
  const saveBreakdown = async () => {
    if (!breakdownResult || !breakdownResult.success) return;

    try {
      const goalsToCreate = isSixMonthGoal 
        ? breakdownResult.monthlyGoals 
        : breakdownResult.weeklyGoals;

      if (!goalsToCreate) return;

      // 순차적으로 목표 생성
      for (const goalData of goalsToCreate) {
        await createGoalMutation.mutateAsync(goalData);
      }

      toast.success(`${goalsToCreate.length}개의 ${isSixMonthGoal ? '월별' : '주별'} 목표가 생성되었습니다`);
      onSuccess?.();
      onClose();
    } catch {
      toast.error('목표 저장에 실패했습니다');
    }
  };

  // 검증 결과
  const validationResult = breakdownResult?.success && (
    isSixMonthGoal ? breakdownResult.monthlyGoals : breakdownResult.weeklyGoals
  ) ? GoalBreakdownService.validateBreakdownResult(
    goal,
    isSixMonthGoal ? breakdownResult.monthlyGoals! : breakdownResult.weeklyGoals!
  ) : null;

  const targetGoals = breakdownResult?.success ? (
    isSixMonthGoal ? breakdownResult.monthlyGoals : breakdownResult.weeklyGoals
  ) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TreeDeciduous className="h-5 w-5" />
            목표 분해
          </DialogTitle>
          <DialogDescription>
            {isSixMonthGoal ? '6개월 목표를 월별 목표로' : '월별 목표를 주별 목표로'} 자동 분해합니다
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">설정</TabsTrigger>
            <TabsTrigger value="preview" disabled={!breakdownResult?.success}>
              미리보기 {targetGoals?.length ? `(${targetGoals.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="smart">스마트 제안</TabsTrigger>
          </TabsList>

          {/* 설정 탭 */}
          <TabsContent value="config" className="space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">원본 목표</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.title}</span>
                  <GoalStatusBadge status={goal.status} size="sm" />
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">시작일:</span>
                    <span className="ml-2">{goal.start_date ? format(new Date(goal.start_date), 'PPP', { locale: ko }) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">종료일:</span>
                    <span className="ml-2">{goal.end_date ? format(new Date(goal.end_date), 'PPP', { locale: ko }) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">목표 달성률:</span>
                    <span className="ml-2">{goal.target_completion_rate || 100}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">우선순위:</span>
                    <span className="ml-2">{goal.priority === 'high' ? '높음' : goal.priority === 'medium' ? '보통' : '낮음'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">분해 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">
                      {isSixMonthGoal ? '생성할 월 수' : '생성할 주 수'}
                    </Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max={isSixMonthGoal ? "12" : "8"}
                      value={isSixMonthGoal ? config.customMonthCount : config.customWeekCount}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        [isSixMonthGoal ? 'customMonthCount' : 'customWeekCount']: Number(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="distribute"
                      checked={config.distributeProgressEvenly}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        distributeProgressEvenly: !!checked
                      }))}
                    />
                    <Label htmlFor="distribute">진행률 균등 분배</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="buffer"
                      checked={config.includeBufferTime}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        includeBufferTime: !!checked
                      }))}
                    />
                    <Label htmlFor="buffer">버퍼 시간 포함</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preserve"
                      checked={config.preserveOriginalDates}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        preserveOriginalDates: !!checked
                      }))}
                    />
                    <Label htmlFor="preserve">원본 날짜 범위 유지</Label>
                  </div>
                </div>

                <Button 
                  onClick={generateBreakdown} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  분해 실행
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 미리보기 탭 */}
          <TabsContent value="preview" className="space-y-4 overflow-hidden">
            {breakdownResult && (
              <>
                {/* 검증 결과 */}
                {validationResult && (
                  <Card className={validationResult.isValid ? 'border-green-200' : 'border-amber-200'}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        {validationResult.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        )}
                        <span className="font-medium">
                          {validationResult.isValid ? '검증 통과' : '검증 이슈 발견'}
                        </span>
                      </div>
                      {!validationResult.isValid && (
                        <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                          {validationResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 경고사항 */}
                {breakdownResult.warnings && breakdownResult.warnings.length > 0 && (
                  <Card className="border-amber-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-700">주의사항</span>
                      </div>
                      <ul className="text-sm text-amber-700 list-disc list-inside">
                        {breakdownResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* 목표 목록 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      생성될 {isSixMonthGoal ? '월별' : '주별'} 목표 ({targetGoals?.length || 0}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      <div className="space-y-3 p-4">
                        {targetGoals?.map((targetGoal, index) => (
                          <Card key={index} className="bg-muted/50">
                            <CardContent className="pt-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{targetGoal.title}</h4>
                                  <Badge variant="outline">
                                    {targetGoal.target_completion_rate}%
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {targetGoal.start_date && format(new Date(targetGoal.start_date), 'MM/dd')}
                                    {' - '}
                                    {targetGoal.end_date && format(new Date(targetGoal.end_date), 'MM/dd')}
                                  </div>
                                  <div>
                                    {isSixMonthGoal ? `${targetGoal.month_number}월차` : `${targetGoal.week_number}주차`}
                                  </div>
                                </div>

                                {targetGoal.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {targetGoal.description}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* 스마트 제안 탭 */}
          <TabsContent value="smart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI 추천 설정
                </CardTitle>
                <CardDescription>
                  목표 특성과 환자 상황을 분석한 최적화된 분해 설정을 제안합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smartSuggestions.suggestions.map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setConfig(suggestion)}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">제안 {index + 1}</h4>
                        <Button variant="outline" size="sm">
                          적용
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {smartSuggestions.reasoning[index]}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {suggestion.distributeProgressEvenly && (
                          <Badge variant="secondary">균등 분배</Badge>
                        )}
                        {suggestion.includeBufferTime && (
                          <Badge variant="secondary">버퍼 시간</Badge>
                        )}
                        {suggestion.preserveOriginalDates && (
                          <Badge variant="secondary">날짜 유지</Badge>
                        )}
                        {suggestion.customMonthCount && (
                          <Badge variant="secondary">{suggestion.customMonthCount}개월</Badge>
                        )}
                        {suggestion.customWeekCount && (
                          <Badge variant="secondary">{suggestion.customWeekCount}주</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          {breakdownResult?.success && (
            <Button 
              onClick={saveBreakdown}
              disabled={createGoalMutation.isPending || !validationResult?.isValid}
            >
              {createGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {targetGoals?.length}개 목표 생성
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 