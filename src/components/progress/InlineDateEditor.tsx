import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, addMonths, addWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { GoalType } from '@/types/goals';
import { fixGoalDatesSimple } from '@/services/fix-goal-dates-simple';
import { handleApiError } from '@/utils/error-handler';

interface InlineDateEditorProps {
  goalId: string;
  goalType: GoalType;
  currentStartDate?: string;
  currentEndDate?: string;
  patientId: string;
}

export default function InlineDateEditor({
  goalId,
  goalType,
  currentStartDate,
  currentEndDate,
  patientId
}: InlineDateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    currentStartDate ? new Date(currentStartDate) : undefined
  );
  const queryClient = useQueryClient();
  
  // 6개월 목표가 아닌 경우 편집 불가능
  const isEditable = goalType === 'six_month';

  const calculateEndDate = (startDate: Date, goalType: GoalType): Date => {
    switch (goalType) {
      case 'six_month':
        return addMonths(startDate, 6);
      case 'monthly':
        return addMonths(startDate, 1);
      case 'weekly':
        return addWeeks(startDate, 1);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    // 즉시 Popover 닫기
    setIsOpen(false);
    
    setStartDate(date);
    const endDate = calculateEndDate(date, goalType);

    try {
      // 6개월 목표의 경우
      if (goalType === 'six_month') {
        // 먼저 6개월 목표 자체의 날짜 업데이트
        const { error } = await supabase
          .from('rehabilitation_goals')
          .update({
            start_date: format(date, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd')
          })
          .eq('id', goalId);

        if (error) throw error;

        // 확인 대화상자
        const shouldRecalculate = confirm(
          '시작 날짜가 변경되었습니다.\n\n' +
          '모든 월간 및 주간 목표의 날짜를 자동으로 재계산하시겠습니까?\n\n' +
          '확인: 전체 날짜 재계산\n' +
          '취소: 6개월 목표 날짜만 변경'
        );

        if (shouldRecalculate) {
          toast.info('하위 목표 날짜를 재계산하는 중...');
          await fixGoalDatesSimple(patientId);
          toast.success('모든 목표 날짜가 재계산되었습니다.');
        } else {
          toast.success('6개월 목표 날짜가 업데이트되었습니다.');
        }
      } else {
        // 월간/주간 목표는 편집 불가능하므로 이 부분은 실행되지 않음
        toast.warning('월간 및 주간 목표의 날짜는 6개월 목표 날짜 변경 시 자동으로 계산됩니다.');
        return;
      }
      
      // 잠시 대기 후 캐시 새로고침 및 리로드
      setTimeout(async () => {
        // 캐시 무효화
        await queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
        await queryClient.invalidateQueries({ queryKey: ['activePatients'] });
        
        // 강제 리페치
        await queryClient.refetchQueries({ queryKey: ['patientGoals', patientId] });
      }, 100);
      
    } catch (error) {
      handleApiError(error, 'InlineDateEditor.handleDateSelect');
      toast.error('날짜 업데이트에 실패했습니다.');
    }
  };

  const getGoalTypeDuration = (type: GoalType) => {
    switch (type) {
      case 'six_month':
        return '6개월';
      case 'monthly':
        return '1개월';
      case 'weekly':
        return '1주';
    }
  };

  // 6개월 목표가 아닌 경우 읽기 전용 표시
  if (!isEditable) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarIcon className="mr-1 h-3 w-3" />
        {startDate ? (
          <span>
            {format(startDate, 'yyyy.MM.dd', { locale: ko })} ~ {' '}
            {currentEndDate ? format(new Date(currentEndDate), 'yyyy.MM.dd', { locale: ko }) : '종료일 계산중'}
          </span>
        ) : (
          <span>날짜 없음</span>
        )}
      </div>
    );
  }

  // 6개월 목표인 경우 편집 가능한 Popover
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <CalendarIcon className="h-3 w-3" />
        {startDate ? (
          <span>
            {format(startDate, 'yyyy.MM.dd', { locale: ko })} ~ {' '}
            {currentEndDate ? format(new Date(currentEndDate), 'yyyy.MM.dd', { locale: ko }) : '종료일 계산중'}
          </span>
        ) : (
          <span>날짜 없음</span>
        )}
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
          >
            목표 시작일 변경
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0 bg-white border-2 border-gray-300 shadow-lg" align="start">
          <div className="p-4 space-y-3 bg-white">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">
                📅 시작일을 선택하면 {getGoalTypeDuration(goalType)} 후 자동으로 종료일이 설정됩니다.
              </p>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleDateSelect}
                disabled={(date) => false}
                initialFocus
                locale={ko}
                className="rounded-md border border-gray-200 bg-white"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}