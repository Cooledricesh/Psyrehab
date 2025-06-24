import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  RefreshCw, 
  Filter
} from 'lucide-react';
import { 
  useArchivedRecommendations, 
  useRefreshArchiveData,
  useExportArchiveData
} from '@/hooks/useAIRecommendationArchive';
import type { ArchivedRecommendation } from '@/services/ai-recommendation-archive';

interface FilterState {
  diagnosisCategory: string;
  ageRange: string;
  searchTerm: string;
}

const AIRecommendationArchiveViewer: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    diagnosisCategory: '',
    ageRange: '',
    searchTerm: ''
  });

  const pageSize = 20;

  // 데이터 조회
  const { 
    data: archivedData, 
    isLoading: isLoadingArchived, 
    error: archivedError 
  } = useArchivedRecommendations({
    limit: pageSize,
    offset: currentPage * pageSize,
    diagnosisCategory: filters.diagnosisCategory || undefined,
    ageRange: filters.ageRange || undefined
  });

  // 액션 훅들
  const refreshData = useRefreshArchiveData();
  const exportData = useExportArchiveData();

  // 필터 핸들러
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    // "all" 값을 빈 문자열로 변환
    const filterValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
    setCurrentPage(0); // 필터 변경 시 첫 페이지로
  };

  const clearFilters = () => {
    setFilters({
      diagnosisCategory: '',
      ageRange: '',
      searchTerm: ''
    });
    setCurrentPage(0);
  };

  // 데이터 내보내기 핸들러
  const handleExport = (format: 'csv' | 'json') => {
    exportData.mutate({
      diagnosisCategory: filters.diagnosisCategory || undefined,
      ageRange: filters.ageRange || undefined,
      format
    });
  };

  // 로딩 상태
  if (isLoadingArchived) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  // 에러 상태
  if (archivedError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            데이터를 불러오는 중 오류가 발생했습니다.
            <br />
            <Button 
              variant="outline" 
              onClick={() => refreshData.mutate()}
              className="mt-2"
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI 추천 아카이빙</h1>
          <p className="text-muted-foreground">
            선택되지 않은 AI 목표 추천들의 아카이빙 데이터를 관리하고 분석합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refreshData.mutate()}
            disabled={refreshData.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshData.isPending ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportData.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diagnosis-category">진단 카테고리</Label>
              <Select
                value={filters.diagnosisCategory || 'all'}
                onValueChange={(value) => handleFilterChange('diagnosisCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="cognitive_disorder">인지 장애</SelectItem>
                  <SelectItem value="mood_disorder">기분 장애</SelectItem>
                  <SelectItem value="anxiety_disorder">불안 장애</SelectItem>
                  <SelectItem value="psychotic_disorder">정신증적 장애</SelectItem>
                  <SelectItem value="substance_disorder">물질 사용 장애</SelectItem>
                  <SelectItem value="developmental_disorder">발달 장애</SelectItem>
                  <SelectItem value="neurological_disorder">신경학적 장애</SelectItem>
                  <SelectItem value="personality_disorder">성격 장애</SelectItem>
                  <SelectItem value="eating_disorder">섭식 장애</SelectItem>
                  <SelectItem value="trauma_disorder">외상 관련 장애</SelectItem>
                  <SelectItem value="other_disorder">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age-range">연령대</Label>
              <Select
                value={filters.ageRange || 'all'}
                onValueChange={(value) => handleFilterChange('ageRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="0-19">0-19세</SelectItem>
                  <SelectItem value="20-29">20-29세</SelectItem>
                  <SelectItem value="30-39">30-39세</SelectItem>
                  <SelectItem value="40-49">40-49세</SelectItem>
                  <SelectItem value="50-59">50-59세</SelectItem>
                  <SelectItem value="60-69">60-69세</SelectItem>
                  <SelectItem value="70+">70세 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">검색</Label>
              <Input
                id="search"
                placeholder="목표 제목이나 내용 검색"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              필터 초기화
            </Button>
            <div className="text-sm text-muted-foreground">
              총 {archivedData?.count || 0}개의 아카이빙된 목표
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 아카이빙된 목표 목록 */}
      <div className="space-y-4">
        {archivedData?.data?.map((item) => (
          <ArchivedGoalCard key={item.id} item={item} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {archivedData && archivedData.count > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {Math.ceil(archivedData.count / pageSize)}
          </span>
          <Button
            variant="outline"
            disabled={(currentPage + 1) * pageSize >= archivedData.count}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};

// 개별 아카이빙된 목표 카드 컴포넌트
const ArchivedGoalCard: React.FC<{ item: ArchivedRecommendation }> = ({ item }) => {
  const [expanded, setExpanded] = useState(true); // 기본적으로 펼쳐진 상태
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              아카이빙된 목표 ({item.archived_goal_data?.length || 0}개)
            </CardTitle>
            <CardDescription className="mt-1">
              {new Date(item.archived_at).toLocaleDateString('ko-KR')} 아카이빙
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {item.diagnosis_category && (
              <Badge variant="secondary">
                {item.diagnosis_category}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '접기' : '펼치기'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 환자 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {item.patient_age_range && (
              <span>연령대: {item.patient_age_range}</span>
            )}
            {item.patient_gender && (
              <span>성별: {item.patient_gender}</span>
            )}
            {item.diagnosis_category && (
              <span>진단: {item.diagnosis_category}</span>
            )}
            <Badge variant="outline">
              {item.archived_reason === 'goal_not_selected' ? '목표 미선택' : '추천 거절'}
            </Badge>
          </div>

          <Separator />

          {/* 아카이빙된 목표들 */}
          <div className="space-y-4">
            {item.archived_goal_data?.map((goal, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-lg">{goal.title || `목표 ${goal.plan_number || index + 1}`}</h4>
                  <Badge variant="outline">계획 {goal.plan_number || index + 1}</Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">목적: </span>
                    <span className="text-sm text-muted-foreground">
                      {goal.purpose || '목적 정보 없음'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">6개월 목표: </span>
                    <span className="text-sm text-muted-foreground">
                      {goal.sixMonthGoal || '6개월 목표 정보 없음'}
                    </span>
                  </div>

                  {expanded && (
                    <>
                      {/* 월간 목표들 */}
                      {goal.monthlyGoals && goal.monthlyGoals.length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">월간 목표:</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {goal.monthlyGoals.map((monthly, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">
                                {monthly.month}개월: {monthly.goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 주간 계획들 (처음 몇 개만) */}
                      {goal.weeklyPlans && goal.weeklyPlans.length > 0 && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">주간 계획 (처음 5개):</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {goal.weeklyPlans.slice(0, 5).map((weekly, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">
                                {weekly.week}주: {weekly.plan}
                              </li>
                            ))}
                          </ul>
                          {goal.weeklyPlans.length > 5 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ... 외 {goal.weeklyPlans.length - 5}개 더
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )) || (
              <div className="text-center text-muted-foreground py-4">
                아카이빙된 목표 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default AIRecommendationArchiveViewer;