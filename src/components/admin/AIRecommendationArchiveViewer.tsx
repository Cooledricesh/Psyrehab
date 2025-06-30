import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Download, 
  RefreshCw, 
  Filter,
  Eye,
  TrendingUp,
  Calendar,
  Target,
  Trash2,
  Users,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  Award
} from 'lucide-react';
import { 
  useArchivedRecommendations, 
  useRefreshArchiveData,
  useExportArchiveData,
  useDeleteArchivedGoal,
  useGoalCompletionHistory
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

      {/* 아카이빙된 목표 테이블 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">생성 날짜</TableHead>
                <TableHead>6개월 목표</TableHead>
                <TableHead className="w-[120px]">환자 정보</TableHead>
                <TableHead className="w-[100px]">진단</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-[80px] text-center">사용</TableHead>
                <TableHead className="w-[80px] text-center">완료</TableHead>
                <TableHead className="w-[80px] text-center">달성률</TableHead>
                <TableHead className="w-[120px] text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    아카이빙된 목표가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                archivedData?.data?.map((item) => (
                  <React.Fragment key={item.id}>
                    <ArchivedGoalRow item={item} />
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

// 개별 아카이빙된 목표 테이블 행 컴포넌트
const ArchivedGoalRow: React.FC<{ item: ArchivedRecommendation }> = ({ item }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const deleteGoal = useDeleteArchivedGoal();
  const { data: completionHistory, isLoading: isLoadingHistory } = useGoalCompletionHistory(isHistoryOpen ? item : null);
  // 목표 제목에서 불필요한 말머리 제거
  const cleanTitle = (title: string) => {
    return title?.replace(/^목표\s*\d+[:.]?\s*/i, '').trim() || title;
  };
  
  // 첫 번째 목표의 제목 가져오기 - 6개월 목표를 우선 표시
  const firstGoalTitle = item.archived_goal_data?.[0] ? 
    item.archived_goal_data[0].sixMonthGoal || cleanTitle(item.archived_goal_data[0].title) || '목표 정보 없음' : 
    '목표 데이터 없음';
  
  // 상태 배지 스타일 결정
  const getStatusBadgeVariant = (reason: string) => {
    switch (reason) {
      case 'successfully_completed': return 'default';
      case 'goal_not_selected': return 'secondary';
      case 'initial_generation': return 'outline';
      default: return 'destructive';
    }
  };
  
  const getStatusText = (reason: string) => {
    switch (reason) {
      case 'successfully_completed': return '성공 완료';
      case 'goal_not_selected': return '미선택';
      case 'initial_generation': return '생성됨';
      case 'goal_selected_and_active': return '선택됨';
      default: return '거절';
    }
  };
  
  // 진단 카테고리 한글화
  const getDiagnosisCategoryKorean = (category: string) => {
    const categoryMap: Record<string, string> = {
      'cognitive_disorder': '인지 장애',
      'mood_disorder': '기분 장애',
      'anxiety_disorder': '불안 장애',
      'psychotic_disorder': '정신증적 장애',
      'substance_disorder': '물질 사용 장애',
      'developmental_disorder': '발달 장애',
      'neurological_disorder': '신경학적 장애',
      'personality_disorder': '성격 장애',
      'eating_disorder': '섭식 장애',
      'trauma_disorder': '외상 관련 장애',
      'other_disorder': '기타'
    };
    return categoryMap[category] || category;
  };
  
  return (
    <>
    <TableRow className="hover:bg-gray-50">
      {/* 생성 날짜 */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className="text-sm">
            {new Date(item.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </span>
        </div>
      </TableCell>
      
      {/* 목표 제목 */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Target className="h-3 w-3 text-gray-400" />
          <span className="text-sm font-medium">
            {firstGoalTitle}
            {item.archived_goal_data && item.archived_goal_data.length > 1 && (
              <span className="text-xs text-muted-foreground ml-1">
                (외 {item.archived_goal_data.length - 1}개)
              </span>
            )}
          </span>
        </div>
      </TableCell>
      
      {/* 환자 정보 */}
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {item.patient_age_range && <span>{item.patient_age_range}</span>}
          {item.patient_gender && <span className="ml-1">({item.patient_gender === 'M' ? '남' : '여'})</span>}
        </div>
      </TableCell>
      
      {/* 진단 */}
      <TableCell>
        {item.diagnosis_category && (
          <Badge variant="outline" className="text-xs">
            {getDiagnosisCategoryKorean(item.diagnosis_category)}
          </Badge>
        )}
      </TableCell>
      
      {/* 상태 */}
      <TableCell>
        <Badge variant={getStatusBadgeVariant(item.archived_reason)}>
          {getStatusText(item.archived_reason)}
        </Badge>
      </TableCell>
      
      {/* 사용 횟수 */}
      <TableCell className="text-center">
        {item.usage_count && item.usage_count > 0 ? (
          <div className="flex items-center justify-center gap-1">
            <Users className="h-3 w-3 text-blue-600" />
            <span className="text-sm font-medium">
              {item.usage_count}명
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      
      {/* 완료 횟수 */}
      <TableCell className="text-center">
        {item.completion_count && item.completion_count > 0 ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {item.completion_count}명
              </span>
            </div>
            {item.usage_count && item.usage_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                {isHistoryOpen ? (
                  <><ChevronUp className="h-3 w-3 mr-1" />접기</>
                ) : (
                  <><ChevronDown className="h-3 w-3 mr-1" />상세보기</>
                )}
              </Button>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      
      {/* 달성률 */}
      <TableCell className="text-center">
        {/* 여러 명이 사용한 경우 평균 달성률, 한 명만 사용한 경우 개별 달성률 표시 */}
        {(item.average_completion_rate !== undefined && item.usage_count && item.usage_count > 1) ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {item.average_completion_rate}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">평균</span>
          </div>
        ) : item.completion_rate ? (
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {item.completion_rate}%
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      
      {/* 관리 */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <GoalDetailDialog item={item} />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (confirm('정말로 이 아카이빙된 목표를 삭제하시겠습니까?')) {
                deleteGoal.mutate(item.id);
              }
            }}
            disabled={deleteGoal.isPending}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
    {/* 완료 이력 드롭다운 */}
    {isHistoryOpen && (
      <TableRow>
        <TableCell colSpan={9} className="bg-gray-50 dark:bg-gray-900/50 border-t-0">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">완료 이력을 불러오는 중...</span>
            </div>
          ) : completionHistory?.patients && completionHistory.patients.length > 0 ? (
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Award className="h-4 w-4 text-green-600" />
                완료한 환자 목록
              </h4>
              <div className="space-y-2">
                {completionHistory.patients.map((patient, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{patient.patient_name}</span>
                        {patient.social_worker_name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            (담당: {patient.social_worker_name})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          달성률: {patient.achievement_rate}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {patient.completed_date ? 
                            new Date(patient.completed_date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }) : '날짜 없음'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
              완료 이력이 없습니다.
            </div>
          )}
        </TableCell>
      </TableRow>
    )}
    </>
  );
};


// 목표 상세 다이얼로그 컴포넌트
const GoalDetailDialog: React.FC<{ item: ArchivedRecommendation }> = ({ item }) => {
  const cleanTitle = (title: string) => {
    return title?.replace(/^목표\s*\d+[:.]?\s*/i, '').trim() || title;
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl"
        aria-describedby="goal-detail-description"
      >
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">아카이빙된 목표 상세</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4" id="goal-detail-description">
          {/* 메타 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">기본 정보</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">생성일:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{new Date(item.created_at).toLocaleString('ko-KR')}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">아카이빙일:</span>
                <span className="ml-2 text-gray-900 dark:text-gray-100">{new Date(item.archived_at).toLocaleString('ko-KR')}</span>
              </div>
              {item.completion_date && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">완료일:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">{new Date(item.completion_date).toLocaleDateString('ko-KR')}</span>
                </div>
              )}
              {(item.average_completion_rate !== undefined && item.usage_count && item.usage_count > 1) ? (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">평균 달성률:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">{item.average_completion_rate}%</span>
                  <span className="ml-1 text-xs text-gray-500">({item.completion_count}명 평균)</span>
                </div>
              ) : item.completion_rate ? (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">달성률:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">{item.completion_rate}%</span>
                </div>
              ) : null}
              {item.usage_count !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">사용한 사람:</span>
                  <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">{item.usage_count}명</span>
                </div>
              )}
              {item.completion_count !== undefined && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">완료한 사람:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">{item.completion_count}명</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 목표 내용 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">목표 내용</h3>
            {item.archived_goal_data?.map((goal, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                    {cleanTitle(goal.title) || `목표 ${index + 1}`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goal.purpose && (
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">목적:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{goal.purpose}</p>
                    </div>
                  )}
                  
                  {goal.sixMonthGoal && (
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">6개월 목표:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{goal.sixMonthGoal}</p>
                    </div>
                  )}
                  
                  {goal.monthlyGoals && goal.monthlyGoals.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">월간 목표 ({goal.monthlyGoals.length}개):</span>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {goal.monthlyGoals.map((monthly, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                            {monthly.month}개월차: {monthly.goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {goal.weeklyPlans && goal.weeklyPlans.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">주간 계획 ({goal.weeklyPlans.length}개):</span>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          펼쳐보기
                        </summary>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {goal.weeklyPlans.map((weekly, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-300">
                              {weekly.week}주차: {weekly.plan}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIRecommendationArchiveViewer;