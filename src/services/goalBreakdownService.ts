import { 
  BaseGoal, 
  SixMonthGoal, 
  MonthlyGoal, 
  WeeklyGoal,
  GoalType,
  GoalPriority,
  CreateGoalRequest 
} from '@/types/goals';
import { addMonths, addWeeks, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface BreakdownConfig {
  includeBufferTime?: boolean;
  distributeProgressEvenly?: boolean;
  preserveOriginalDates?: boolean;
  customMonthCount?: number;
  customWeekCount?: number;
}

export interface BreakdownResult {
  success: boolean;
  monthlyGoals?: CreateGoalRequest[];
  weeklyGoals?: CreateGoalRequest[];
  errors?: string[];
  warnings?: string[];
}

export class GoalBreakdownService {
  /**
   * 6개월 목표를 월별 목표로 분해
   */
  static breakdownSixMonthGoal(
    goal: SixMonthGoal,
    config: BreakdownConfig = {}
  ): BreakdownResult {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 기본 검증
      if (!goal.start_date || !goal.end_date) {
        errors.push('시작일과 종료일이 필요합니다.');
        return { success: false, errors };
      }

      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      const monthCount = config.customMonthCount || 6;

      // 날짜 범위 검증
      const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (monthsDiff < monthCount) {
        warnings.push(`목표 기간이 ${monthCount}개월보다 짧습니다. 기간을 조정하는 것을 고려해보세요.`);
      }

      // 진행률 분배 계산
      const progressPerMonth = Math.floor((goal.target_completion_rate || 100) / monthCount);
      const remainingProgress = (goal.target_completion_rate || 100) % monthCount;

      const monthlyGoals: CreateGoalRequest[] = [];

      for (let i = 0; i < monthCount; i++) {
        const monthStartDate = addMonths(startDate, i);
        const monthEndDate = config.preserveOriginalDates && i === monthCount - 1
          ? endDate
          : endOfMonth(monthStartDate);

        // 마지막 달에 남은 진행률 추가
        const monthProgress = progressPerMonth + (i === monthCount - 1 ? remainingProgress : 0);

        const monthlyGoal: CreateGoalRequest = {
          patient_id: goal.patient_id,
          title: `${goal.title} - ${i + 1}월차`,
          description: `${goal.description || ''}\n\n[6개월 목표에서 자동 생성됨: ${goal.title}]`,
          goal_type: 'monthly' as GoalType,
          status: 'pending',
          priority: goal.priority,
          category_id: goal.category_id,
          parent_goal_id: goal.id,
          start_date: format(monthStartDate, 'yyyy-MM-dd'),
          end_date: format(monthEndDate, 'yyyy-MM-dd'),
          target_completion_rate: monthProgress,
          month_number: i + 1,
          sequence_number: i + 1,
          evaluation_criteria: {
            ...goal.evaluation_criteria,
            breakdown_source: 'six_month_goal',
            original_goal_id: goal.id,
            auto_generated: true
          },
          created_by_social_worker_id: goal.created_by_social_worker_id
        };

        monthlyGoals.push(monthlyGoal);
      }

      return {
        success: true,
        monthlyGoals,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch {
      return {
        success: false,
        errors: [`목표 분해 중 오류가 발생했습니다: ${""instanceOf Error ? "Error" : '알 수 없는 오류'}`]
      };
    }
  }

  /**
   * 월별 목표를 주별 목표로 분해
   */
  static breakdownMonthlyGoal(
    goal: MonthlyGoal,
    config: BreakdownConfig = {}
  ): BreakdownResult {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 기본 검증
      if (!goal.start_date || !goal.end_date) {
        errors.push('시작일과 종료일이 필요합니다.');
        return { success: false, errors };
      }

      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      const weekCount = config.customWeekCount || 4;

      // 주별 기간 계산
      const weeksDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      if (weeksDiff < weekCount) {
        warnings.push(`목표 기간이 ${weekCount}주보다 짧습니다.`);
      }

      // 진행률 분배 계산
      const progressPerWeek = Math.floor((goal.target_completion_rate || 100) / weekCount);
      const remainingProgress = (goal.target_completion_rate || 100) % weekCount;

      const weeklyGoals: CreateGoalRequest[] = [];

      for (let i = 0; i < weekCount; i++) {
        const weekStartDate = addWeeks(startDate, i);
        const weekEndDate = config.preserveOriginalDates && i === weekCount - 1
          ? endDate
          : endOfWeek(weekStartDate, { locale: ko });

        // 마지막 주에 남은 진행률 추가
        const weekProgress = progressPerWeek + (i === weekCount - 1 ? remainingProgress : 0);

        const weeklyGoal: CreateGoalRequest = {
          patient_id: goal.patient_id,
          title: `${goal.title} - ${i + 1}주차`,
          description: `${goal.description || ''}\n\n[월별 목표에서 자동 생성됨: ${goal.title}]`,
          goal_type: 'weekly' as GoalType,
          status: 'pending',
          priority: goal.priority,
          category_id: goal.category_id,
          parent_goal_id: goal.id,
          start_date: format(weekStartDate, 'yyyy-MM-dd'),
          end_date: format(weekEndDate, 'yyyy-MM-dd'),
          target_completion_rate: weekProgress,
          week_number: i + 1,
          month_number: goal.month_number,
          sequence_number: i + 1,
          evaluation_criteria: {
            ...goal.evaluation_criteria,
            breakdown_source: 'monthly_goal',
            original_goal_id: goal.id,
            auto_generated: true
          },
          created_by_social_worker_id: goal.created_by_social_worker_id
        };

        weeklyGoals.push(weeklyGoal);
      }

      return {
        success: true,
        weeklyGoals,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch {
      return {
        success: false,
        errors: [`목표 분해 중 오류가 발생했습니다: ${""instanceOf Error ? "Error" : '알 수 없는 오류'}`]
      };
    }
  }

  /**
   * 전체 계층 분해 (6개월 → 월별 → 주별)
   */
  static async breakdownFullHierarchy(
    goal: SixMonthGoal,
    config: BreakdownConfig = {}
  ): Promise<BreakdownResult> {
    try {
      // 1단계: 6개월 → 월별 분해
      const monthlyResult = this.breakdownSixMonthGoal(goal, config);
      if (!monthlyResult.success || !monthlyResult.monthlyGoals) {
        return monthlyResult;
      }

      const allWeeklyGoals: CreateGoalRequest[] = [];
      const allWarnings: string[] = monthlyResult.warnings || [];
      const allErrors: string[] = [];

      // 2단계: 각 월별 목표를 주별로 분해
      for (const monthlyGoal of monthlyResult.monthlyGoals) {
        // 임시 MonthlyGoal 객체 생성 (분해를 위해)
        const tempMonthlyGoal: MonthlyGoal = {
          ...monthlyGoal,
          id: `temp-${Date.now()}-${Math.random()}`, // 임시 ID
          goal_type: 'monthly',
          actual_completion_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const weeklyResult = this.breakdownMonthlyGoal(tempMonthlyGoal, config);
        
        if (weeklyResult.success && weeklyResult.weeklyGoals) {
          allWeeklyGoals.push(...weeklyResult.weeklyGoals);
          if (weeklyResult.warnings) {
            allWarnings.push(...weeklyResult.warnings);
          }
        } else if (weeklyResult.errors) {
          allErrors.push(...weeklyResult.errors);
        }
      }

      return {
        success: allErrors.length === 0,
        monthlyGoals: monthlyResult.monthlyGoals,
        weeklyGoals: allWeeklyGoals,
        warnings: allWarnings.length > 0 ? allWarnings : undefined,
        errors: allErrors.length > 0 ? allErrors : undefined
      };

    } catch {
      return {
        success: false,
        errors: [`전체 계층 분해 중 오류가 발생했습니다: ${""instanceOf Error ? "Error" : '알 수 없는 오류'}`]
      };
    }
  }

  /**
   * 분해 결과 검증
   */
  static validateBreakdownResult(
    originalGoal: BaseGoal,
    breakdownGoals: CreateGoalRequest[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 진행률 합계 검증
    const totalProgress = breakdownGoals.reduce(
      (sum, goal) => sum + (goal.target_completion_rate || 0), 
      0
    );
    
    if (Math.abs(totalProgress - (originalGoal.target_completion_rate || 100)) > 1) {
      issues.push(`분해된 목표들의 진행률 합계(${totalProgress}%)가 원래 목표(${originalGoal.target_completion_rate || 100}%)와 일치하지 않습니다.`);
    }

    // 날짜 범위 검증
    if (originalGoal.start_date && originalGoal.end_date) {
      const originalStart = new Date(originalGoal.start_date);
      const originalEnd = new Date(originalGoal.end_date);
      
      const breakdownDates = breakdownGoals
        .filter(goal => goal.start_date && goal.end_date)
        .map(goal => ({
          start: new Date(goal.start_date!),
          end: new Date(goal.end_date!)
        }));

      const earliestStart = Math.min(...breakdownDates.map(d => d.start.getTime()));
      const latestEnd = Math.max(...breakdownDates.map(d => d.end.getTime()));

      if (earliestStart < originalStart.getTime()) {
        issues.push('일부 분해된 목표의 시작일이 원래 목표의 시작일보다 이릅니다.');
      }

      if (latestEnd > originalEnd.getTime()) {
        issues.push('일부 분해된 목표의 종료일이 원래 목표의 종료일보다 늦습니다.');
      }
    }

    // 순서 검증
    const sequences = breakdownGoals
      .map(goal => goal.sequence_number)
      .filter(seq => seq !== undefined) as number[];
    
    const uniqueSequences = new Set(sequences);
    if (sequences.length !== uniqueSequences.size) {
      issues.push('분해된 목표들의 순서 번호에 중복이 있습니다.');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * 스마트 분해 제안 생성 (AI 기반)
   */
  static generateSmartBreakdownSuggestions(
    goal: BaseGoal,
    patientContext?: {
      previousGoals?: BaseGoal[];
      preferences?: Record<string, any>;
      constraints?: string[];
    }
  ): {
    suggestions: BreakdownConfig[];
    reasoning: string[];
  } {
    const suggestions: BreakdownConfig[] = [];
    const reasoning: string[] = [];

    // 기본 균등 분배 제안
    suggestions.push({
      distributeProgressEvenly: true,
      includeBufferTime: false,
      preserveOriginalDates: true
    });
    reasoning.push('균등한 진행률 분배로 일정한 진도 유지');

    // 버퍼 시간 포함 제안
    suggestions.push({
      distributeProgressEvenly: false,
      includeBufferTime: true,
      preserveOriginalDates: false
    });
    reasoning.push('예상치 못한 지연을 대비한 버퍼 시간 포함');

    // 환자 이전 성과 기반 제안
    if (patientContext?.previousGoals) {
      const completedGoals = patientContext.previousGoals.filter(g => g.status === 'completed');
      const completionRate = completedGoals.length / patientContext.previousGoals.length;

      if (completionRate > 0.8) {
        suggestions.push({
          distributeProgressEvenly: true,
          includeBufferTime: false,
          customMonthCount: goal.goal_type === 'six_month' ? 5 : undefined,
          customWeekCount: goal.goal_type === 'monthly' ? 3 : undefined
        });
        reasoning.push('높은 성공률을 바탕으로 단축된 일정 제안');
      } else if (completionRate < 0.5) {
        suggestions.push({
          distributeProgressEvenly: false,
          includeBufferTime: true,
          customMonthCount: goal.goal_type === 'six_month' ? 7 : undefined,
          customWeekCount: goal.goal_type === 'monthly' ? 5 : undefined
        });
        reasoning.push('과거 성과를 고려한 여유로운 일정 제안');
      }
    }

    return { suggestions, reasoning };
  }
}

export default GoalBreakdownService; 