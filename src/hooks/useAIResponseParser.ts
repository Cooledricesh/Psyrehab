// AI 응답 파싱을 위한 타입 정의
interface AIGoal {
  id: number;
  title: string;
  description: string;
  purpose?: string;
  sixMonthTarget?: string;
  monthlyPlans?: any[];
  weeklyPlans?: any[];
}

interface AIResponse {
  goals?: any;
  six_month_goals?: any;
  recommendations?: any;
  response?: any;
  content?: any;
  reasoning?: string;
}

interface ParsedAIResponse {
  goals: AIGoal[];
  reasoning?: string;
}

const useAIResponseParser = () => {
  
  // 데이터 구조 정규화 (단순화)
  const normalizeGoalsData = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) return Object.values(data);
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : Object.values(parsed);
      } catch {
        return [{ title: data, description: '' }];
      }
    }
    return [];
  };

  // 3개 목표 파싱 (단순화된 버전)
  const parseThreeGoals = (text: string): AIGoal[] => {
    if (!text) return [];
    
    // 패턴 1: ### 목표 N 형식
    const sectionPattern = /###\s*목표\s*(\d+)[:\.]?\s*(.*?)(?=###\s*목표\s*\d+|$)/gs;
    const matches = Array.from(text.matchAll(sectionPattern));
    
    if (matches.length >= 3) {
      return matches.slice(0, 3).map((match, index) => ({
        id: index + 1,
        title: `목표 ${index + 1}`,
        description: match[2]?.trim() || ''
      }));
    }

    // 패턴 2: 목표 N: 형식
    const basicPattern = /목표\s*(\d+)[:\.]?\s*(.*?)(?=목표\s*\d+|$)/gs;
    const basicMatches = Array.from(text.matchAll(basicPattern));
    
    if (basicMatches.length >= 3) {
      return basicMatches.slice(0, 3).map((match, index) => ({
        id: index + 1,
        title: `목표 ${index + 1}`,
        description: match[2]?.trim() || ''
      }));
    }

    // 패턴 3: 단순 3등분 (최후 수단)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length >= 6) { // 최소한의 내용이 있어야 분할
      const chunkSize = Math.ceil(lines.length / 3);
      return Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        title: `목표 ${i + 1}`,
        description: lines.slice(i * chunkSize, (i + 1) * chunkSize).join('\n').trim()
      }));
    }

    return [];
  };

  // 텍스트 소스 추출 (우선순위 순)
  const extractTextSources = (response: AIResponse): string[] => {
    const sources = [
      response.goals,
      response.six_month_goals,
      response.recommendations,
      response.response,
      response.content
    ];

    return sources
      .filter(Boolean)
      .map(source => typeof source === 'string' ? source : JSON.stringify(source));
  };

  // 메인 파싱 함수
  const parseAIResponse = (response: AIResponse): ParsedAIResponse => {
    console.log('🔍 AI 응답 파싱 시작:', response);

    // 1. 직접적인 goals 구조 확인
    if (response.goals) {
      const normalizedGoals = normalizeGoalsData(response.goals);
      if (normalizedGoals.length > 0) {
        // 이미 구조화된 데이터라면 그대로 사용
        if (normalizedGoals.length >= 3 && normalizedGoals[0]?.title) {
          console.log('✅ 구조화된 목표 데이터 발견');
          return {
            goals: normalizedGoals.slice(0, 3).map((goal, index) => ({
              id: index + 1,
              title: goal.title || `목표 ${index + 1}`,
              description: goal.description || '',
              purpose: goal.purpose,
              sixMonthTarget: goal.sixMonthTarget,
              monthlyPlans: goal.monthlyPlans,
              weeklyPlans: goal.weeklyPlans
            })),
            reasoning: response.reasoning
          };
        }

        // 텍스트 파싱 필요
        const firstGoal = normalizedGoals[0];
        const textToParse = typeof firstGoal === 'string' 
          ? firstGoal 
          : firstGoal?.description || firstGoal?.content || JSON.stringify(firstGoal);
        
        const parsedGoals = parseThreeGoals(textToParse);
        if (parsedGoals.length >= 3) {
          console.log('✅ 첫 번째 목표에서 3개 파싱 성공');
          return { goals: parsedGoals, reasoning: response.reasoning };
        }
      }
    }

    // 2. 텍스트 소스에서 파싱 시도
    const textSources = extractTextSources(response);
    for (const text of textSources) {
      const parsedGoals = parseThreeGoals(text);
      if (parsedGoals.length >= 3) {
        console.log('✅ 텍스트 소스에서 3개 파싱 성공');
        return { goals: parsedGoals, reasoning: response.reasoning };
      }
    }

    console.log('⚠️ 파싱 실패 - 빈 결과 반환');
    return { goals: [], reasoning: response.reasoning };
  };

  return {
    parseAIResponse,
    normalizeGoalsData,
    parseThreeGoals
  };
};

export default useAIResponseParser; 