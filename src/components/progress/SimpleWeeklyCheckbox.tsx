import { useState, useEffect } from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Circle, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { eventBus, EVENTS } from '@/lib/eventBus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SimpleWeeklyCheckboxProps {
  weeklyGoal: {
    id: string;
    title: string;
    sequence_number: number;
    status: string;
  };
  patientId: string;
}

export default function SimpleWeeklyCheckbox({ weeklyGoal, patientId }: SimpleWeeklyCheckboxProps) {
  // status를 기반으로 초기 선택 상태 설정
  const getInitialValue = (status: string) => {
    if (status === 'completed') return 'completed';
    if (status === 'incomplete' || status === 'cancelled') return 'incomplete';
    return 'none';
  };

  const [selectedValue, setSelectedValue] = useState(getInitialValue(weeklyGoal.status));
  const [showCongrats, setShowCongrats] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null);
  const [pendingGoalType, setPendingGoalType] = useState<'monthly' | 'six_month' | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // weeklyGoal이 변경되면 선택 상태도 업데이트
    setSelectedValue(getInitialValue(weeklyGoal.status));
  }, [weeklyGoal.status]);

  const updateGoalStatus = useMutation({
    mutationFn: async (value: string) => {
      let newStatus = 'active'; // 기본값 (둘 다 미체크)
      let completionRate = 0;
      let completionDate = null;

      if (value === 'completed') {
        newStatus = 'completed';
        completionRate = 100;
        completionDate = new Date().toISOString().split('T')[0];
      } else if (value === 'incomplete') {
        newStatus = 'cancelled'; // 미달성은 cancelled 상태로 처리
        completionRate = 0;
        completionDate = null;
      }

      const { data, error } = await supabase
        .from('rehabilitation_goals')
        .update({ 
          status: newStatus,
          actual_completion_rate: completionRate,
          completion_date: completionDate
        })
        .eq('id', weeklyGoal.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // 먼저 캐시를 무효화하여 최신 데이터 가져오기
      await queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
      
      // 먼저 현재 목표의 부모 월간 목표 확인
      const { data: parentMonthlyGoal } = await supabase
        .from('rehabilitation_goals')
        .select('id, status, parent_goal_id')
        .eq('id', data.parent_goal_id)
        .single();

      if (parentMonthlyGoal) {
        // 해당 월간 목표의 모든 주간 목표 확인
        const { data: weeklyGoals } = await supabase
          .from('rehabilitation_goals')
          .select('status')
          .eq('parent_goal_id', parentMonthlyGoal.id)
          .eq('goal_type', 'weekly');

        if (weeklyGoals && weeklyGoals.length > 0) {
          const allWeeklyCompleted = weeklyGoals.every(g => 
            g.status === 'completed' || g.status === 'cancelled'
          );

          // 모든 주간 목표가 체크되었으면(달성/미달성 무관) 월간 목표도 완료 처리 대화상자 표시
          if (allWeeklyCompleted && parentMonthlyGoal.status === 'active') {
            setPendingGoalId(parentMonthlyGoal.id);
            setPendingGoalType('monthly');
            setShowConfirmComplete(true);
            return;
          }
        }
      }

      // 6개월 목표 확인
      const { data: sixMonthGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id, status, progress')
        .eq('patient_id', patientId)
        .eq('goal_type', 'six_month')
        .neq('status', 'completed'); // 아직 완료되지 않은 목표만

      if (sixMonthGoals && sixMonthGoals.length > 0) {
        // 각 6개월 목표에 대해 확인
        for (const sixMonthGoal of sixMonthGoals) {
          const { data: monthlyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('status')
            .eq('parent_goal_id', sixMonthGoal.id)
            .eq('goal_type', 'monthly');

          if (monthlyGoals && monthlyGoals.length > 0) {
            const allMonthlyCompleted = monthlyGoals.every(g => 
              g.status === 'completed' || g.status === 'cancelled'
            );
            const hasAtLeastOneMonthlyCompleted = monthlyGoals.some(g => 
              g.status === 'completed'
            );
            
            if (allMonthlyCompleted && hasAtLeastOneMonthlyCompleted) {
              // 모든 월간 목표가 완료되었으므로 6개월 목표 완료 확인 요청
              setPendingGoalId(sixMonthGoal.id);
              setPendingGoalType('six_month');
              setShowConfirmComplete(true);
              return; // 대화상자를 표시하므로 일반 토스트는 표시하지 않음
            }
          }
        }
      }
      
      // 일반 토스트 메시지
      if (data.status === 'completed') {
        toast.success('목표를 달성했습니다!');
      } else if (data.status === 'cancelled') {
        toast.info('목표를 미달성으로 표시했습니다.');
      } else {
        toast.info('목표 상태를 초기화했습니다.');
      }
      
      // 진행 상황 통계 새로고침
      await queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    },
    onError: (error) => {
      console.error("Error occurred");
      toast.error('목표 상태 업데이트에 실패했습니다.');
    }
  });

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    updateGoalStatus.mutate(value);
  };

  const getStatusIcon = () => {
    switch (selectedValue) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'incomplete':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleConfirmGoalComplete = async () => {
    if (!pendingGoalId || !pendingGoalType) return;
    
    let completionRate = 100; // 기본값
    
    // 6개월 목표인 경우 실제 달성률 계산
    if (pendingGoalType === 'six_month') {
      // 월간 목표들 조회
      const { data: monthlyGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id')
        .eq('parent_goal_id', pendingGoalId)
        .eq('goal_type', 'monthly');
      
      if (monthlyGoals && monthlyGoals.length > 0) {
        let totalWeeklyGoals = 0;
        let completedWeeklyGoals = 0;
        
        // 각 월간 목표의 주간 목표들 확인
        for (const monthlyGoal of monthlyGoals) {
          const { data: weeklyGoals } = await supabase
            .from('rehabilitation_goals')
            .select('id, status')
            .eq('parent_goal_id', monthlyGoal.id)
            .eq('goal_type', 'weekly');
          
          if (weeklyGoals) {
            totalWeeklyGoals += weeklyGoals.length;
            completedWeeklyGoals += weeklyGoals.filter(g => g.status === 'completed').length;
          }
        }
        
        // 24개 주간 목표를 기준으로 달성률 계산
        completionRate = totalWeeklyGoals > 0 
          ? Math.round((completedWeeklyGoals / 24) * 100) 
          : 0;
      }
    }
    
    // 목표 완료 처리
    const { error: updateError } = await supabase
      .from('rehabilitation_goals')
      .update({ 
        status: 'completed',
        completion_date: new Date().toISOString().split('T')[0],
        actual_completion_rate: completionRate
      })
      .eq('id', pendingGoalId);
    
    if (updateError) {
      console.error(`${pendingGoalType === 'monthly' ? '월간' : '6개월'} 목표 완료 처리 실패:`, updateError);
      toast.error(`${pendingGoalType === 'monthly' ? '월간' : '6개월'} 목표 완료 처리에 실패했습니다.`);
      return;
    }
    
    // 6개월 목표가 완료되면 자동으로 아카이빙
    if (pendingGoalType === 'six_month') {
      try {
        const { AIRecommendationArchiveService } = await import('@/services/ai-recommendation-archive');
        await AIRecommendationArchiveService.archiveCompletedGoal(pendingGoalId);
        console.log('✅ 완료된 6개월 목표 자동 아카이빙 성공');
      } catch (error) {
        console.error('⚠️ 목표 아카이빙 실패 (메인 플로우는 계속):', error);
      }
    }
    
    setShowConfirmComplete(false);
    setPendingGoalId(null);
    setPendingGoalType(null);
    
    if (pendingGoalType === 'monthly') {
      toast.success('월간 목표를 완료했습니다!');
      
      // 월간 목표 완료 이벤트 발생 (드롭다운 닫기 위해)
      eventBus.emit(EVENTS.MONTHLY_GOAL_COMPLETED, {
        goalId: pendingGoalId,
        patientId: patientId
      });
      
      // 캐시 새로고침
      await queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
      await queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      // 아카이빙 관련 캐시도 무효화
      await queryClient.invalidateQueries({ queryKey: ['archived-recommendations'] });
      await queryClient.invalidateQueries({ queryKey: ['archive-statistics'] });
    } else {
      // 6개월 목표인 경우, 다른 활성 6개월 목표가 있는지 확인
      const { data: remainingGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id')
        .eq('patient_id', patientId)
        .eq('goal_type', 'six_month')
        .neq('status', 'completed');
      
      if (!remainingGoals || remainingGoals.length === 0) {
        // 모든 6개월 목표가 완료됨
        setShowCongrats(true);
      } else {
        toast.success('6개월 목표를 완료했습니다!');
        // 캐시 새로고침
        await queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
        await queryClient.invalidateQueries({ queryKey: ['progressStats'] });
        // 아카이빙 관련 캐시도 무효화
        await queryClient.invalidateQueries({ queryKey: ['archived-recommendations'] });
        await queryClient.invalidateQueries({ queryKey: ['archive-statistics'] });
      }
    }
  };

  const handleCancelGoalComplete = () => {
    setShowConfirmComplete(false);
    setPendingGoalId(null);
    setPendingGoalType(null);
    toast.info(`${pendingGoalType === 'monthly' ? '월간' : '6개월'} 목표는 아직 진행 중입니다.`);
  };

  const handleCongratulationClose = async () => {
    setShowCongrats(false);
    
    // 환자 상태를 pending으로 변경
    const { error } = await supabase
      .from('patients')
      .update({ status: 'pending' })
      .eq('id', patientId);
    
    if (error) {
      console.error("Error occurred");
      toast.error('환자 상태 업데이트에 실패했습니다.');
    } else {
      toast.success('모든 재활 목표를 완료했습니다! 새로운 목표를 설정해주세요.');
      
      // 이벤트 발생
      eventBus.emit(EVENTS.PATIENT_STATUS_CHANGED, {
        patientId: patientId,
        newStatus: 'pending'
      });
      
      // 모든 관련 쿼리 새로고침
      await queryClient.invalidateQueries({ queryKey: ['activePatients'] });
      await queryClient.invalidateQueries({ queryKey: ['patientGoals'] });
      await queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-3 border-b last:border-b-0">
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon()}
          <span className={cn(
            "text-sm",
            selectedValue === 'completed' && "line-through text-green-600",
            selectedValue === 'incomplete' && "text-red-600"
          )}>
            {weeklyGoal.sequence_number}주차: {weeklyGoal.title}
          </span>
        </div>
        <RadioGroup
          value={selectedValue}
          onValueChange={handleValueChange}
          className="flex gap-6"
          disabled={updateGoalStatus.isPending}
        >
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                selectedValue === 'completed' 
                  ? "border-blue-600 bg-blue-600" 
                  : "border-gray-300",
                updateGoalStatus.isPending && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !updateGoalStatus.isPending && handleValueChange('completed')}
            >
              {selectedValue === 'completed' && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <Label 
              className="cursor-pointer text-sm text-green-600 font-medium"
              onClick={() => !updateGoalStatus.isPending && handleValueChange('completed')}
            >
              달성
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
                selectedValue === 'incomplete' 
                  ? "border-blue-600 bg-blue-600" 
                  : "border-gray-300",
                updateGoalStatus.isPending && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !updateGoalStatus.isPending && handleValueChange('incomplete')}
            >
              {selectedValue === 'incomplete' && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </div>
            <Label 
              className="cursor-pointer text-sm text-red-600 font-medium"
              onClick={() => !updateGoalStatus.isPending && handleValueChange('incomplete')}
            >
              미달성
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 목표 완료 확인 대화상자 */}
      <AlertDialog open={showConfirmComplete} onOpenChange={setShowConfirmComplete}>
        <AlertDialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
          <div className="text-center space-y-6 p-2">
            {/* 아이콘 */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200">
              <Target className="h-8 w-8 text-amber-600" />
            </div>
            
            {/* 제목 */}
            <div className="space-y-2">
              <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                {pendingGoalType === 'monthly' ? '월간 목표' : '6개월 목표'} 완료 확인
              </AlertDialogTitle>
              <div className="text-sm text-gray-500">
                모든 하위 목표 완료
              </div>
            </div>

            {/* 메시지 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">훌륭합니다!</span>
              </div>
              <AlertDialogDescription className="text-sm text-green-700 leading-relaxed">
                모든 하위 목표를 성공적으로 완료하셨습니다.<br />
                <span className="font-medium">{pendingGoalType === 'monthly' ? '월간' : '6개월'} 목표</span>를 
                달성한 것으로 처리하시겠습니까?
              </AlertDialogDescription>
            </div>

            {/* 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <AlertDialogCancel 
                onClick={handleCancelGoalComplete}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                아니요, 아직입니다
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmGoalComplete}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                네, 달성했습니다
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 축하 메시지 대화상자 */}
      <AlertDialog open={showCongrats} onOpenChange={setShowCongrats}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <AlertDialogTitle className="text-2xl">
              축하합니다! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              모든 재활 목표를 성공적으로 달성하셨습니다!<br />
              환자의 노력과 헌신에 박수를 보냅니다.<br />
              이제 새로운 목표를 설정할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={handleCongratulationClose} className="bg-green-600 hover:bg-green-700">
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}