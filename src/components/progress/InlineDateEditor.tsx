import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, addMonths, addWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { GoalType } from '@/types/goals';

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

    setStartDate(date);
    const endDate = calculateEndDate(date, goalType);

    try {
      const { error } = await supabase
        .from('rehabilitation_goals')
        .update({
          start_date: format(date, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        })
        .eq('id', goalId);

      if (error) throw error;

      // 캐시 새로고침
      await queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
      
      toast.success('날짜가 업데이트되었습니다.');
      setIsOpen(false);
    } catch (error) {
      console.error('날짜 업데이트 실패:', error);
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

  return (
    <div className="flex items-center gap-2 text-sm">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-auto p-1 font-normal justify-start",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {startDate ? (
              <span>
                {format(startDate, 'yyyy.MM.dd', { locale: ko })} ~ {' '}
                {currentEndDate ? format(new Date(currentEndDate), 'yyyy.MM.dd', { locale: ko }) : '종료일 계산중'}
              </span>
            ) : (
              <span>시작일 지정</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-2 border-gray-300 shadow-lg" align="start">
          <div className="p-4 space-y-3 bg-white">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">
                📅 시작일을 선택하면 {getGoalTypeDuration(goalType)} 후 자동으로 종료일이 설정됩니다.
              </p>
            </div>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleDateSelect}
              disabled={(date) => false}
              initialFocus
              locale={ko}
              className="rounded-md border-2 border-gray-200 bg-white shadow-sm"
              modifiers={{
                sunday: (date) => date.getDay() === 0,
              }}
              modifiersClassNames={{
                sunday: "text-red-500 font-semibold",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}