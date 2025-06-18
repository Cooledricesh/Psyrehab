import { useState, useEffect } from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';
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
  const [pendingSixMonthGoalId, setPendingSixMonthGoalId] = useState<string | null>(null);
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
      
      // 6개월 목표 확인
      const { data: sixMonthGoals } = await supabase
        .from('rehabilitation_goals')
        .select('id, status, progress')
        .eq('patient_id', patientId)
        .eq('goal_type', 'six_month')
        .eq('plan_status', 'active')
        .neq('status', 'completed'); // 아직 완료되지 않은 목표만

      if (sixMonthGoals && sixMonthGoals.length > 0) {
        // 각 6개월 목표에 대해 확인
        for (const sixMonthGoal of sixMonthGoals) {
          const { data: subGoals } = await supabase
            .from('rehabilitation_goals')
            .select('status')
            .eq('parent_goal_id', sixMonthGoal.id)
            .in('goal_type', ['monthly', 'weekly']);

          if (subGoals && subGoals.length > 0) {
            const allCompleted = subGoals.every(g => 
              g.status === 'completed' || g.status === 'cancelled'
            );
            const hasAtLeastOneCompleted = subGoals.some(g => 
              g.status === 'completed'
            );
            
            if (allCompleted && hasAtLeastOneCompleted) {
              // 모든 하위 목표가 완료되었으므로 6개월 목표 완료 확인 요청
              setPendingSixMonthGoalId(sixMonthGoal.id);
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
      console.error('목표 상태 업데이트 실패:', error);
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

  const handleConfirmSixMonthComplete = async () => {
    if (!pendingSixMonthGoalId) return;
    
    // 6개월 목표 완료 처리
    const { error: updateError } = await supabase
      .from('rehabilitation_goals')
      .update({ 
        status: 'completed',
        completion_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', pendingSixMonthGoalId);
    
    if (updateError) {
      console.error('6개월 목표 완료 처리 실패:', updateError);
      toast.error('6개월 목표 완료 처리에 실패했습니다.');
      return;
    }
    
    // 다른 활성 6개월 목표가 있는지 확인
    const { data: remainingGoals } = await supabase
      .from('rehabilitation_goals')
      .select('id')
      .eq('patient_id', patientId)
      .eq('goal_type', 'six_month')
      .eq('plan_status', 'active')
      .neq('status', 'completed');
    
    setShowConfirmComplete(false);
    setPendingSixMonthGoalId(null);
    
    if (!remainingGoals || remainingGoals.length === 0) {
      // 모든 6개월 목표가 완료됨
      setShowCongrats(true);
    } else {
      toast.success('6개월 목표를 완료했습니다!');
      // 캐시 새로고침
      await queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
      await queryClient.invalidateQueries({ queryKey: ['progressStats'] });
    }
  };

  const handleCancelSixMonthComplete = () => {
    setShowConfirmComplete(false);
    setPendingSixMonthGoalId(null);
    toast.info('6개월 목표는 아직 진행 중입니다.');
  };

  const handleCongratulationClose = async () => {
    setShowCongrats(false);
    
    // 환자 상태를 inactive로 변경
    const { error } = await supabase
      .from('patients')
      .update({ status: 'inactive' })
      .eq('id', patientId);
    
    if (error) {
      console.error('환자 상태 업데이트 실패:', error);
      toast.error('환자 상태 업데이트에 실패했습니다.');
    } else {
      toast.success('모든 재활 목표를 완료했습니다! 새로운 목표를 설정해주세요.');
      
      // 이벤트 발생
      eventBus.emit(EVENTS.PATIENT_STATUS_CHANGED, {
        patientId: patientId,
        newStatus: 'inactive'
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

      {/* 6개월 목표 완료 확인 대화상자 */}
      <AlertDialog open={showConfirmComplete} onOpenChange={setShowConfirmComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>6개월 목표 달성 확인</AlertDialogTitle>
            <AlertDialogDescription>
              모든 하위 목표를 완료하셨습니다!<br />
              6개월 목표를 달성한 것으로 처리하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSixMonthComplete}>
              아니요, 아직입니다
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSixMonthComplete}>
              네, 달성했습니다
            </AlertDialogAction>
          </AlertDialogFooter>
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