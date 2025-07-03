import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Sparkles, ChevronRight, CheckCircle, Star } from 'lucide-react';
import { AIRecommendationArchiveService, type ArchivedRecommendation } from '@/services/ai-recommendation-archive';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  patientGender,
  diagnosisCategory,
  focusTime,
  motivationLevel,
  pastSuccesses,
  constraints,
  socialPreference,
  onSelectArchived,
  onGenerateNew,
  onBack
}: ArchivedGoalSelectionProps) {
  const [loading, setLoading] = useState(true);
  const [archivedGoals, setArchivedGoals] = useState<ArchivedRecommendation[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchArchivedGoals();
  }, []);

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
    const selected = archivedGoals.find(g => g.id === selectedGoalId);
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
    <Card>
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

        {archivedGoals.length > 0 ? (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">유사한 환자의 목표 ({archivedGoals.length}개)</h3>
              <RadioGroup value={selectedGoalId} onValueChange={setSelectedGoalId}>
                {archivedGoals.map((goal) => {
                  const goalData = goal.archived_goal_data[0];
                  return (
                    <Card key={goal.id} className="cursor-pointer hover:border-primary">
                      <CardContent className="p-4">
                        <Label htmlFor={goal.id} className="cursor-pointer space-y-2">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={goal.id} id={goal.id} />
                            <div className="flex-1 space-y-1">
                              {/* 매칭 타입 배지 */}
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-medium">{goalData.title}</div>
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
                        </Label>
                      </CardContent>
                    </Card>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="flex gap-3">
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
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              유사한 환자의 목표를 찾을 수 없습니다
            </p>
            <Button onClick={onGenerateNew} className="mx-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              AI로 새 목표 생성하기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}