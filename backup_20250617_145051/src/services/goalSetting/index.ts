// Goal Setting 관련 서비스들
export { AssessmentService } from './assessmentService';
export { AIRecommendationService } from './aiRecommendationService';
export { GoalService } from './goalService';

// 타입들도 함께 export
export type { AssessmentData } from './assessmentService';
export type { 
  AIRecommendationRequest, 
  AIRecommendationResponse, 
  AIGoalRecommendation 
} from './aiRecommendationService';
export type { GoalData, DetailedGoals } from './goalService';
