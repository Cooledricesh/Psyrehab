import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  BaseGoal, 
  GoalType, 
  GoalStatus, 
  GoalPriority,
  CreateGoalRequest,
  UpdateGoalRequest
} from '@/types/goals';
import { useGoals, useCreateGoal, useUpdateGoal, useGoalCategories } from '@/hooks/useGoals';

const goalFormSchema = z.object({
  title: z.string().min(1, '목표 제목을 입력해주세요'),
  description: z.string().optional(),
  goal_type: z.enum(['six_month', 'monthly', 'weekly'] as const),
  status: z.enum(['pending', 'active', 'completed', 'on_hold', 'cancelled'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
  category_id: z.string().optional(),
  parent_goal_id: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  target_completion_rate: z.number().min(0).max(100).default(100),
  sequence_number: z.number().optional(),
  week_number: z.number().optional(),
  month_number: z.number().optional(),
  evaluation_criteria: z.record(z.any()).optional(),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: BaseGoal;
  defaultGoalType?: GoalType;
  parentGoalId?: string;
  patientId: string;
  onSubmit: (data: GoalFormData) => Promise<void>;
}

export const GoalForm: React.FC<GoalFormProps> = ({
  isOpen,
  onClose,
  goal,
  defaultGoalType = 'six_month',
  parentGoalId,
  patientId,
  onSubmit
}) => {
  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goal_type: defaultGoalType,
      status: 'pending',
      priority: 'medium',
      target_completion_rate: 100,
      parent_goal_id: parentGoalId,
    }
  });

  const { data: categories } = useGoalCategories();
  const { data: goals } = useGoals(patientId);
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();

  const watchedGoalType = form.watch('goal_type');

  // 목표 유형에 따른 부모 목표 필터링
  const availableParentGoals = React.useMemo(() => {
    if (!goals) return [];
    
    switch (watchedGoalType) {
      case 'monthly':
        return goals.filter(g => g.goal_type === 'six_month');
      case 'weekly':
        return goals.filter(g => g.goal_type === 'monthly');
      default:
        return [];
    }
  }, [goals, watchedGoalType]);

  // 기존 목표 데이터로 폼 초기화
  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        description: goal.description || '',
        goal_type: goal.goal_type,
        status: goal.status,
        priority: goal.priority,
        category_id: goal.category_id || '',
        parent_goal_id: goal.parent_goal_id || '',
        start_date: goal.start_date ? new Date(goal.start_date) : undefined,
        end_date: goal.end_date ? new Date(goal.end_date) : undefined,
        target_completion_rate: goal.target_completion_rate || 100,
        sequence_number: goal.sequence_number || undefined,
        week_number: goal.week_number || undefined,
        month_number: goal.month_number || undefined,
        evaluation_criteria: goal.evaluation_criteria || {},
      });
    }
  }, [goal, form]);

  const handleSubmit = async (data: GoalFormData) => {
    try {
      await onSubmit(data);
      onClose();
      form.reset();
    } catch {
      console.error("Error occurred");
    }
  };

  const getGoalTypeLabel = (type: GoalType) => {
    switch (type) {
      case 'six_month': return '6개월 목표';
      case 'monthly': return '월별 목표';
      case 'weekly': return '주별 목표';
      default: return type;
    }
  };

  const getStatusLabel = (status: GoalStatus) => {
    switch (status) {
      case 'pending': return '대기';
      case 'active': return '진행 중';
      case 'completed': return '완료';
      case 'on_hold': return '보류';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: GoalPriority) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {goal ? '목표 수정' : '새 목표 생성'}
          </DialogTitle>
          <DialogDescription>
            {goal ? '기존 목표를 수정합니다' : '새로운 재활 목표를 생성합니다'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>목표 제목 *</FormLabel>
                    <FormControl>
                      <Input placeholder="목표 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>목표 유형 *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!goal} // 수정 시에는 유형 변경 불가
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="목표 유형 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="six_month">{getGoalTypeLabel('six_month')}</SelectItem>
                        <SelectItem value="monthly">{getGoalTypeLabel('monthly')}</SelectItem>
                        <SelectItem value="weekly">{getGoalTypeLabel('weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>우선순위</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="우선순위 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">{getPriorityLabel('high')}</SelectItem>
                        <SelectItem value="medium">{getPriorityLabel('medium')}</SelectItem>
                        <SelectItem value="low">{getPriorityLabel('low')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 설명 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>목표 설명</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="목표에 대한 상세한 설명을 입력하세요"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 카테고리 및 부모 목표 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {availableParentGoals.length > 0 && (
                <FormField
                  control={form.control}
                  name="parent_goal_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>부모 목표</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="부모 목표 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableParentGoals.map((parentGoal) => (
                            <SelectItem key={parentGoal.id} value={parentGoal.id}>
                              {parentGoal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>시작일</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ko })
                            ) : (
                              <span>시작일 선택</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>종료일</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ko })
                            ) : (
                              <span>종료일 선택</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 추가 정보 */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="target_completion_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>목표 달성률 (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedGoalType === 'weekly' && (
                <FormField
                  control={form.control}
                  name="week_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주차</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="52"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(watchedGoalType === 'monthly' || watchedGoalType === 'weekly') && (
                <FormField
                  control={form.control}
                  name="month_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>월</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="12"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* 상태 (수정 시에만) */}
            {goal && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{getStatusLabel('pending')}</SelectItem>
                        <SelectItem value="active">{getStatusLabel('active')}</SelectItem>
                        <SelectItem value="completed">{getStatusLabel('completed')}</SelectItem>
                        <SelectItem value="on_hold">{getStatusLabel('on_hold')}</SelectItem>
                        <SelectItem value="cancelled">{getStatusLabel('cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
                {(createGoalMutation.isPending || updateGoalMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {goal ? '수정' : '생성'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 