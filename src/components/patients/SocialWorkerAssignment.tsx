import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { 
  useActiveSocialWorkers,
  useRecommendedSocialWorkers,
  useAssignSocialWorker,
  useUnassignSocialWorker 
} from '@/hooks/useSocialWorkers'
import type { Patient, SocialWorker } from '@/types/database'
import { handleApiError } from '@/utils/error-handler'

interface SocialWorkerAssignmentProps {
  patient: Patient
  onAssignmentChange?: () => void
}

export function SocialWorkerAssignment({ patient, onAssignmentChange }: SocialWorkerAssignmentProps) {
  const [selectedSocialWorkerId, setSelectedSocialWorkerId] = useState<string>('')
  const [showRecommendations, setShowRecommendations] = useState(false)

  const { data: activeSocialWorkers, isLoading: loadingActive } = useActiveSocialWorkers()
  const { data: recommendedSocialWorkers, isLoading: loadingRecommended } = useRecommendedSocialWorkers()
  const assignMutation = useAssignSocialWorker()
  const unassignMutation = useUnassignSocialWorker()

  const currentSocialWorker = activeSocialWorkers?.find(sw => 
    sw.id === patient.primary_social_worker_id
  )

  const handleAssign = async () => {
    if (!selectedSocialWorkerId) return

    try {
      await assignMutation.mutateAsync({
        patientId: patient.id,
        socialWorkerId: selectedSocialWorkerId
      })
      setSelectedSocialWorkerId('')
      onAssignmentChange?.()
    } catch (error) {
      handleApiError(error, 'SocialWorkerAssignment.handleAssign')
    }
  }

  const handleUnassign = async () => {
    try {
      await unassignMutation.mutateAsync(patient.id)
      onAssignmentChange?.()
    } catch (error) {
      handleApiError(error, 'SocialWorkerAssignment.handleUnassign')
    }
  }

  const handleRecommendedSelect = (socialWorker: SocialWorker) => {
    setSelectedSocialWorkerId(socialWorker.id)
    setShowRecommendations(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          사회복지사 배정
        </CardTitle>
        <CardDescription>
          환자에게 담당 사회복지사를 배정하거나 변경할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 배정된 사회복지사 */}
        <div>
          <h4 className="text-sm font-medium mb-2">현재 담당 사회복지사</h4>
          {currentSocialWorker ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">{currentSocialWorker.full_name}</p>
                  {currentSocialWorker.department && (
                    <p className="text-sm text-green-600">{currentSocialWorker.department}</p>
                  )}
                  {currentSocialWorker.specializations && currentSocialWorker.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentSocialWorker.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnassign}
                disabled={unassignMutation.isPending}
              >
                {unassignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                배정 해제
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">배정된 사회복지사가 없습니다.</span>
            </div>
          )}
        </div>

        {/* 새 사회복지사 배정 */}
        <div>
          <h4 className="text-sm font-medium mb-2">
            새 사회복지사 {currentSocialWorker ? '변경' : '배정'}
          </h4>
          
          {/* 추천 사회복지사 */}
          {!showRecommendations && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecommendations(true)}
              disabled={loadingRecommended}
              className="mb-3"
            >
              {loadingRecommended && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              추천 사회복지사 보기
            </Button>
          )}

          {showRecommendations && recommendedSocialWorkers && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-medium text-blue-800 mb-2">추천 사회복지사 (업무량 기준)</h5>
              <div className="space-y-2">
                {recommendedSocialWorkers.map((sw) => (
                  <div
                    key={sw.id}
                    className="flex items-center justify-between p-2 bg-white border border-blue-200 rounded cursor-pointer hover:bg-blue-50"
                    onClick={() => handleRecommendedSelect(sw)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{sw.full_name}</p>
                        <p className="text-xs text-gray-500">업무량: {sw.workload || 0}명</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      선택
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecommendations(false)}
                className="mt-2"
              >
                닫기
              </Button>
            </div>
          )}

          {/* 사회복지사 선택 */}
          <div className="space-y-3">
            <Select value={selectedSocialWorkerId} onValueChange={setSelectedSocialWorkerId}>
              <SelectTrigger>
                <SelectValue placeholder="사회복지사를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {loadingActive ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">로딩 중...</span>
                  </div>
                ) : activeSocialWorkers?.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    활성 사회복지사가 없습니다.
                  </div>
                ) : (
                  activeSocialWorkers?.map((sw) => (
                    <SelectItem key={sw.id} value={sw.id}>
                      <div className="flex items-center gap-2">
                        <span>{sw.full_name}</span>
                        <span className="text-xs text-gray-500">({sw.workload || 0}명)</span>
                        {sw.specializations && sw.specializations.length > 0 && (
                          <div className="flex gap-1">
                            {sw.specializations.slice(0, 2).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAssign}
              disabled={!selectedSocialWorkerId || assignMutation.isPending}
              className="w-full"
            >
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {currentSocialWorker ? '사회복지사 변경' : '사회복지사 배정'}
            </Button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {(assignMutation.error || unassignMutation.error) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {assignMutation.error?.message || unassignMutation.error?.message}
            </AlertDescription>
          </Alert>
        )}

        {/* 성공 메시지 */}
        {(assignMutation.isSuccess || unassignMutation.isSuccess) && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              사회복지사 배정이 성공적으로 {assignMutation.isSuccess ? '완료' : '해제'}되었습니다.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 