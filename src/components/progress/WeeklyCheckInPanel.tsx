import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  SmilePlus, 
  Frown, 
  Meh, 
  Smile, 
  Laugh,
  Edit,
  Plus,
  Calendar,
  User,
  FileText,
  Heart,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface WeeklyCheckIn {
  id: string;
  goal_id: string;
  week_number: number;
  check_in_date: string;
  is_completed: boolean;
  completion_notes: string | null;
  obstacles_faced: string | null;
  support_needed: string | null;
  mood_rating: number | null;
  checked_by: string;
  social_workers?: {
    full_name: string;
  };
}

export interface WeeklyGoal {
  id: string;
  title: string;
  description?: string;
  sequence_number: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface WeeklyCheckInPanelProps {
  weeklyGoal: WeeklyGoal | null;
  checkIns: WeeklyCheckIn[];
  patientId: string;
  onClose: () => void;
}

export default function WeeklyCheckInPanel({ 
  weeklyGoal, 
  checkIns, 
  patientId,
  onClose 
}: WeeklyCheckInPanelProps) {
  const [isAddingCheckIn, setIsAddingCheckIn] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 체크인 추가/수정 폼 상태
  const [formData, setFormData] = useState({
    is_completed: false,
    completion_notes: '',
    obstacles_faced: '',
    support_needed: '',
    mood_rating: 3
  });

  // 체크인 추가 mutation
  const addCheckInMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('사용자 정보 가져오기 실패:', userError);
        throw new Error('로그인이 필요합니다.');
      }

      // social_worker 정보 확인
      const { data: socialWorker, error: swError } = await supabase
        .from('social_workers')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .single();

      if (swError || !socialWorker) {
        console.error('사회복지사 정보 확인 실패:', swError);
        throw new Error('사회복지사 권한이 필요합니다.');
      }

      const { data: result, error } = await supabase
        .from('weekly_check_ins')
        .insert({
          goal_id: weeklyGoal!.id,
          week_number: weeklyGoal!.sequence_number,
          check_in_date: new Date().toISOString().split('T')[0],
          checked_by: userData.user.id,
          ...data
        })
        .select(`
          *,
          social_workers!checked_by(
            full_name
          )
        `)
        .single();

      if (error) {
        console.error("Error occurred");
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      toast.success('주간 체크인이 추가되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['weeklyCheckIns', weeklyGoal?.id] });
      queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
      setIsAddingCheckIn(false);
      resetForm();
    },
    onError: (error: unknown) => {
      console.error("Error occurred");
      if (error.message === '로그인이 필요합니다.') {
        toast.error('로그인이 필요합니다.');
      } else if (error.message === '사회복지사 권한이 필요합니다.') {
        toast.error('사회복지사 권한이 필요합니다.');
      } else {
        toast.error('체크인 추가에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    }
  });

  // 체크인 수정 mutation
  const updateCheckInMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: result, error } = await supabase
        .from('weekly_check_ins')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          social_workers!checked_by(
            full_name
          )
        `)
        .single();

      if (error) {
        console.error("Error occurred");
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      toast.success('체크인이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['weeklyCheckIns', weeklyGoal?.id] });
      queryClient.invalidateQueries({ queryKey: ['patientGoals', patientId] });
      setEditingCheckIn(null);
      resetForm();
    },
    onError: (error: unknown) => {
      console.error("Error occurred");
      toast.error('체크인 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  });

  const resetForm = () => {
    setFormData({
      is_completed: false,
      completion_notes: '',
      obstacles_faced: '',
      support_needed: '',
      mood_rating: 3
    });
  };

  const getMoodIcon = (rating: number) => {
    switch (rating) {
      case 1: return <Frown className="h-5 w-5 text-red-500" />;
      case 2: return <Meh className="h-5 w-5 text-orange-500" />;
      case 3: return <Smile className="h-5 w-5 text-yellow-500" />;
      case 4: return <SmilePlus className="h-5 w-5 text-green-500" />;
      case 5: return <Laugh className="h-5 w-5 text-green-600" />;
      default: return null;
    }
  };

  const handleSubmit = () => {
    if (editingCheckIn) {
      updateCheckInMutation.mutate({ id: editingCheckIn, data: formData });
    } else {
      addCheckInMutation.mutate(formData);
    }
  };

  const handleEdit = (checkIn: WeeklyCheckIn) => {
    setEditingCheckIn(checkIn.id);
    setFormData({
      is_completed: checkIn.is_completed,
      completion_notes: checkIn.completion_notes || '',
      obstacles_faced: checkIn.obstacles_faced || '',
      support_needed: checkIn.support_needed || '',
      mood_rating: checkIn.mood_rating || 3
    });
    setIsAddingCheckIn(true);
  };

  if (!weeklyGoal) return null;

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">주간 체크인</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-base text-foreground">
            {weeklyGoal.sequence_number}주차: {weeklyGoal.title}
          </p>
          {weeklyGoal.description && (
            <p className="text-sm">{weeklyGoal.description}</p>
          )}
          <p className="text-xs">
            기간: {format(new Date(weeklyGoal.start_date), 'M월 d일', { locale: ko })} ~ 
            {format(new Date(weeklyGoal.end_date), 'M월 d일', { locale: ko })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 체크인 목록 */}
        {checkIns.length > 0 ? (
          <div className="space-y-3">
            {checkIns.map((checkIn) => (
              <div key={checkIn.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(new Date(checkIn.check_in_date), 'M월 d일 (E)', { locale: ko })}
                    </span>
                    {checkIn.is_completed ? (
                      <Badge variant="success" className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>완료</span>
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <XCircle className="h-3 w-3" />
                        <span>미완료</span>
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(checkIn)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {checkIn.mood_rating && (
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">기분:</span>
                    {getMoodIcon(checkIn.mood_rating)}
                  </div>
                )}

                {checkIn.completion_notes && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>완료 내용</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {checkIn.completion_notes}
                    </p>
                  </div>
                )}

                {checkIn.obstacles_faced && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>직면한 장애물</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {checkIn.obstacles_faced}
                    </p>
                  </div>
                )}

                {checkIn.support_needed && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      <User className="h-4 w-4 text-blue-500" />
                      <span>필요한 지원</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {checkIn.support_needed}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  체크인: {checkIn.social_workers?.full_name || '알 수 없음'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            아직 체크인이 없습니다.
          </div>
        )}

        {/* 체크인 추가 버튼 */}
        {!isAddingCheckIn && (
          <Button 
            onClick={() => setIsAddingCheckIn(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            체크인 추가
          </Button>
        )}

        {/* 체크인 추가/수정 폼 */}
        <Dialog open={isAddingCheckIn} onOpenChange={setIsAddingCheckIn}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>
                {editingCheckIn ? '체크인 수정' : '새 체크인 추가'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label className="w-24">완료 여부</Label>
                <Button
                  type="button"
                  variant={formData.is_completed ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, is_completed: !prev.is_completed }))}
                >
                  {formData.is_completed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      완료
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4 mr-2" />
                      미완료
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>기분 평가</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[formData.mood_rating]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mood_rating: value[0] }))}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="w-8">
                    {getMoodIcon(formData.mood_rating)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>완료 내용</Label>
                <Textarea
                  value={formData.completion_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, completion_notes: e.target.value }))}
                  placeholder="이번 주에 달성한 내용을 기록하세요..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>직면한 장애물</Label>
                <Textarea
                  value={formData.obstacles_faced}
                  onChange={(e) => setFormData(prev => ({ ...prev, obstacles_faced: e.target.value }))}
                  placeholder="목표 달성 과정에서 겪은 어려움을 기록하세요..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>필요한 지원</Label>
                <Textarea
                  value={formData.support_needed}
                  onChange={(e) => setFormData(prev => ({ ...prev, support_needed: e.target.value }))}
                  placeholder="추가로 필요한 도움이나 자원을 기록하세요..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddingCheckIn(false);
                setEditingCheckIn(null);
                resetForm();
              }}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {editingCheckIn ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}