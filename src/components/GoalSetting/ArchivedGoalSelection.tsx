import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Sparkles, ChevronRight, CheckCircle, Star, Archive, Check } from 'lucide-react';
import { AIRecommendationArchiveService, type ArchivedRecommendation } from '@/services/ai-recommendation-archive';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';

interface ArchivedGoalSelectionProps {
  patientAge?: number;
  patientGender?: string;
  diagnosisCategory?: string;
  // 평가 항목 추가
  focusTime?: string;
  motivationLevel?: number;
  pastSuccesses?: string[];
  constraints?: string[];
  socialPreference?: string;
  onSelectArchived: (archivedGoal: ArchivedRecommendation) => void;
  onGenerateNew: () => void;
  onBack?: () => void;
}

export function ArchivedGoalSelection({
  patientAge,
  focusTime,
  motivationLevel,
  pastSuccesses,
  constraints,
  socialPreference,
  onSelectArchived,
  onGenerateNew,
  onBack
}: ArchivedGoalSelectionProps) {
  // '목표 N:' 형식의 접두사를 제거하는 함수
  const removeGoalPrefix = (text: string): string => {
    if (!text) return text;
    // '목표 1:', '목표1:', '목표 2 :', 등의 패턴 제거
    return text.replace(/^목표\s*\d+\s*[:：]\s*/i, '').trim();
  };
  const [loading, setLoading] = useState(true);
  const [archivedGoals, setArchivedGoals] = useState<ArchivedRecommendation[]>([]);
  const [allArchivedGoals, setAllArchivedGoals] = useState<ArchivedRecommendation[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingAll, setLoadingAll] = useState(false);
  const pageSize = 10;
  const allGoalsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchArchivedGoals();
  }, []);

  useEffect(() => {
    fetchAllArchivedGoals();
  }, [currentPage]);

  const fetchArchivedGoals = async () => {
    try {
      setLoading(true);
      setError('');

      // 연령대 계산
      const ageRange = getAgeRange(patientAge);

      // 새로운 평가 기반 검색 사용
      const goals = await AIRecommendationArchiveService.searchArchivedGoalsByAssessment({
        ageRange,
        focusTime,
        motivationLevel,
        pastSuccesses,
        constraints,
        socialPreference,
        limit: 5
      });

      setArchivedGoals(goals);
    } catch (err) {
      console.error('아카이빙된 목표 조회 실패:', err);
      setError('아카이빙된 목표를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllArchivedGoals = async () => {
    try {
      setLoadingAll(true);
      const result = await AIRecommendationArchiveService.getArchivedRecommendations({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      });
      
      setAllArchivedGoals(result.data);
      setTotalCount(result.count);
      
      // 스크롤 위치 조정 제거 - 자동 스크롤 방지
    } catch (err) {
      console.error('전체 아카이빙된 목표 조회 실패:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  const getAgeRange = (age?: number): string | undefined => {
    if (!age) return undefined;
    
    if (age < 20) return '0-19';
    if (age < 30) return '20-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    if (age < 70) return '60-69';
    return '70+';
  };

  const handleSelectArchived = () => {
    const selected = [...archivedGoals, ...allArchivedGoals].find(g => g.id === selectedGoalId);
    if (selected) {
      onSelectArchived(selected);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">유사한 목표를 검색하는 중...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          목표 설정 방법 선택
        </CardTitle>
        <CardDescription>
          유사한 환자의 기존 목표를 사용하거나 AI로 새로운 목표를 생성할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 유사한 환자의 목표 섹션 */}
        <div className="space-y-4">
          <h3 className="font-medium">유사한 환자의 목표 ({archivedGoals.length}개)</h3>
          {archivedGoals.length > 0 ? (
            <div className="space-y-3">
              {archivedGoals.map((goal) => {
                  const goalData = goal.archived_goal_data[0];
                  return (
                    <Card 
                      key={goal.id} 
                      className={`cursor-pointer hover:border-primary transition-all ${
                        selectedGoalId === goal.id ? 'border-primary ring-2 ring-primary ring-opacity-20' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedGoalId(goal.id);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              selectedGoalId === goal.id ? 'border-primary bg-primary' : 'border-gray-300'
                            }`}>
                              {selectedGoalId === goal.id && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              {/* 매칭 타입 배지 */}
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-medium">{removeGoalPrefix(goalData.title)}</div>
                                {goal.matchInfo?.matchType === 'exact' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    완벽 매칭
                                  </span>
                                )}
                                {goal.matchInfo?.matchType === 'similar' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                                    유사 매칭
                                  </span>
                                )}
                                {goal.matchInfo?.matchType === 'age_only' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">
                                    연령대 매칭
                                  </span>
                                )}
                                {goal.matchInfo?.matchType === 'popular' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                                    <Star className="h-3 w-3" />
                                    인기 목표
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{goalData.purpose}</div>
                              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                {/* 매칭 정보 표시 */}
                                {goal.matchInfo && goal.matchInfo.matchedFields && goal.matchInfo.matchedFields.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-medium">매칭 항목:</span>
                                    {goal.matchInfo.matchedFields.map((field, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* 평가 항목 값 표시 */}
                                {goal.matchInfo && (
                                  <div className="flex flex-col gap-1 text-gray-500">
                                    {goal.matchInfo.focusTime && (
                                      <span>집중 가능 시간: {goal.matchInfo.focusTime}</span>
                                    )}
                                    {goal.matchInfo.motivationLevel !== undefined && (
                                      <span>변화 동기: {goal.matchInfo.motivationLevel}점</span>
                                    )}
                                    {goal.matchInfo.socialPreference && (
                                      <span>사회성: {goal.matchInfo.socialPreference}</span>
                                    )}
                                  </div>
                                )}
                                {/* 기존 정보 */}
                                {goal.patient_age_range && (
                                  <div>
                                    <span className="text-gray-500">연령대: {goal.patient_age_range}</span>
                                    {goal.archived_reason === 'successfully_completed' && (
                                      <span className="ml-2 text-green-600 font-medium">
                                        ✓ 성공적으로 완료됨 {goal.completion_rate && `(달성률: ${goal.completion_rate}%)`}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                유사한 환자의 목표를 찾을 수 없습니다
              </p>
            </div>
          )}
        </div>

        {/* 전체 아카이빙된 목표 섹션 */}
        <Separator className="my-6" />
        
        <div className="space-y-4" ref={allGoalsRef}>
              <h3 className="font-medium flex items-center gap-2">
                <Archive className="h-4 w-4" />
                전체 아카이빙된 목표 ({totalCount}개)
              </h3>
              <div className="space-y-3">
                {loadingAll ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">목표를 불러오는 중...</span>
                    </CardContent>
                  </Card>
                ) : allArchivedGoals.map((goal) => {
                  const goalData = goal.archived_goal_data[0];
                  return (
                    <Card 
                      key={goal.id} 
                      className={`cursor-pointer hover:border-primary transition-all ${
                        selectedGoalId === goal.id ? 'border-primary ring-2 ring-primary ring-opacity-20' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedGoalId(goal.id);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              selectedGoalId === goal.id ? 'border-primary bg-primary' : 'border-gray-300'
                            }`}>
                              {selectedGoalId === goal.id && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">{removeGoalPrefix(goalData.title)}</div>
                              <div className="text-sm text-muted-foreground">{goalData.purpose}</div>
                              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                {goal.patient_age_range && (
                                  <div>
                                    <span className="text-gray-500">연령대: {goal.patient_age_range}</span>
                                    {goal.archived_reason === 'successfully_completed' && (
                                      <span className="ml-2 text-green-600 font-medium">
                                        ✓ 성공적으로 완료됨 {goal.completion_rate && `(달성률: ${goal.completion_rate}%)`}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {goal.diagnosis_category && (
                                  <span className="text-gray-500">진단: {goal.diagnosis_category}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* 페이지네이션 */}
              {totalCount > pageSize && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (currentPage > 1) {
                            setCurrentPage(prev => prev - 1);
                          }
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {/* 페이지 번호들 */}
                    {(() => {
                      const totalPages = Math.ceil(totalCount / pageSize);
                      const pages: React.ReactNode[] = [];
                      
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, currentPage + 2);

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={currentPage === i}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentPage(i);
                              }}
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }

                      return pages;
                    })()}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (currentPage < Math.ceil(totalCount / pageSize)) {
                            setCurrentPage(prev => prev + 1);
                          }
                        }}
                        className={currentPage >= Math.ceil(totalCount / pageSize) ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
        </div>

        {/* 버튼 섹션 */}
        <div className="flex gap-3 mt-6">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
            >
              이전
            </Button>
          )}
          <Button
            onClick={handleSelectArchived}
            disabled={!selectedGoalId}
            className="flex-1"
          >
            선택한 목표 사용하기
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={onGenerateNew}
            variant="outline"
            className="flex-1"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI로 새 목표 생성
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}