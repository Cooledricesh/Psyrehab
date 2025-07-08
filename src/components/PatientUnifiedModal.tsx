import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getPatientById, updatePatient, deletePatient, checkPatientRelatedData } from '@/services/patient-management'
import type { Patient, CreatePatientData } from '@/services/patient-management'
import { canEditPatient } from '@/lib/auth-utils'
import { MoreVertical, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { handleApiError } from '@/utils/error-handler'

interface PatientUnifiedModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onSuccess: () => void
}

export default function PatientUnifiedModal({ 
  isOpen, 
  onClose, 
  patientId,
  onSuccess 
}: PatientUnifiedModalProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [relatedData, setRelatedData] = useState<any[]>([])
  const [forceDelete, setForceDelete] = useState(false)
  
  const [formData, setFormData] = useState<CreatePatientData>({
    full_name: '',
    patient_identifier: '',
    date_of_birth: '',
    gender: '',
    primary_diagnosis: '',
    doctor: '',
    contact_info: {},
    additional_info: {}
  })

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetail()
      checkEditPermission()
      setIsEditing(false) // 모달이 열릴 때마다 상세보기 모드로 시작
    }
  }, [isOpen, patientId])

  const fetchPatientDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 환자 상세 정보 가져오기:', patientId)
      
      const patientData = await getPatientById(patientId)
      
      if (patientData) {
        console.log('✅ 환자 상세 정보 로드 성공:', patientData)
        setPatient(patientData)
        
        // 폼 데이터도 함께 초기화
        setFormData({
          full_name: patientData.name || '',
          patient_identifier: patientData.id || '',
          date_of_birth: patientData.birth_date || '',
          gender: patientData.gender || '',
          primary_diagnosis: patientData.diagnosis || '',
          doctor: patientData.doctor || '',
          contact_info: patientData.contact_info || {},
          additional_info: {}
        })
      } else {
        setError('환자 정보를 찾을 수 없습니다.')
      }
    } catch (err: unknown) {
      handleApiError(err, 'PatientUnifiedModal.fetchPatientDetail')
      setError(err instanceof Error ? err.message : '환자 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const checkEditPermission = async () => {
    try {
      const hasPermission = await canEditPatient(patientId)
      setCanEdit(hasPermission)
    } catch (error) {
      handleApiError(error, 'PatientUnifiedModal.checkEditPermission')
      setCanEdit(false)
    }
  }

  const handleEditMode = () => {
    setIsEditing(true)
    setShowContextMenu(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setError(null)
    // 원본 데이터로 폼 데이터 복원
    if (patient) {
      setFormData({
        full_name: patient.name || '',
        patient_identifier: patient.id || '',
        date_of_birth: patient.birth_date || '',
        gender: patient.gender || '',
        primary_diagnosis: patient.diagnosis || '',
        doctor: patient.doctor || '',
        contact_info: patient.contact_info || {},
        additional_info: {}
      })
    }
  }

  const handleInputChange = (field: keyof CreatePatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleContactInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name?.trim()) {
      setError('환자 이름을 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      console.log('📝 환자 정보 수정 시도:', formData)
      
      const result = await updatePatient(patientId, formData)
      
      if (result) {
        console.log('✅ 환자 정보 수정 성공:', result)
        setPatient(result) // 업데이트된 환자 정보로 상태 갱신
        setIsEditing(false) // 편집 모드 종료
        onSuccess() // 목록 새로고침
      } else {
        setError('환자 정보 수정에 실패했습니다.')
      }
      
    } catch (err: unknown) {
      handleApiError(err, 'PatientUnifiedModal.handleSubmit')
      setError(err instanceof Error ? err.message : '환자 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMode = async () => {
    setShowContextMenu(false)
    
    try {
      // 연관 데이터 확인
      const related = await checkPatientRelatedData(patient?.id || '')
      setRelatedData(related)
      setForceDelete(false)
      setShowDeleteConfirm(true)
    } catch (err) {
      handleApiError(err, 'PatientUnifiedModal.handleDeleteMode')
      setError('연관 데이터 확인 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!patient) return

    try {
      setIsDeleting(true)
      setError(null)

      console.log('🗑️ 환자 삭제 시도:', { patientId: patient.id, forceDelete })
      
      await deletePatient(patient.id, forceDelete)
      
      console.log('✅ 환자 삭제 성공')
      onSuccess() // 목록 새로고침
      handleClose() // 모달 닫기
      
    } catch (err: unknown) {
      handleApiError(err, 'PatientUnifiedModal.handleDeleteConfirm')
      setError(err instanceof Error ? err.message : '환자 삭제 중 오류가 발생했습니다.')
      
      // 연관 데이터 때문에 실패한 경우 강제 삭제 옵션 제공
      if (err instanceof Error && err.message.includes('연결된 데이터가 있어')) {
        // 모달은 열어두고 강제 삭제 옵션만 활성화
      } else {
        setShowDeleteConfirm(false) // 다른 오류인 경우 모달 닫기
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setError(null)
    setRelatedData([])
    setForceDelete(false)
  }

  const handleClose = () => {
    setIsEditing(false)
    setError(null)
    setShowContextMenu(false)
    setShowDeleteConfirm(false)
    setRelatedData([])
    setForceDelete(false)
    onClose()
  }

  if (!isOpen) return null

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male':
        return '남성'
      case 'female':
        return '여성'
      case 'other':
        return '기타'
      default:
        return gender || '정보 없음'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '목표 진행 중'
      case 'pending':
        return '목표 설정 대기'
      case 'discharged':
        return '입원 중'
      default:
        return '알 수 없음'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'discharged':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? '환자 정보 편집' : '환자 상세 정보'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && canEdit && (
              <div className="relative">
                <button
                  onClick={() => setShowContextMenu(!showContextMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showContextMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={handleEditMode}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                      편집
                    </button>
                    <button
                      onClick={handleDeleteMode}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">환자 정보를 불러오는 중...</div>
          </div>
        ) : error && !isEditing ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={fetchPatientDetail} variant="outline">다시 시도</Button>
          </div>
        ) : patient ? (
          isEditing ? (
            // 편집 모드
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환자 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="환자 이름을 입력하세요"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환자 식별번호
                  </label>
                  <input
                    type="text"
                    value={formData.patient_identifier}
                    onChange={(e) => handleInputChange('patient_identifier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                    placeholder="환자 식별번호"
                    disabled={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생년월일
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성별
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">성별을 선택하세요</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태 <span className="text-sm text-gray-500">(읽기 전용)</span>
                  </label>
                  <input
                    type="text"
                    value={getStatusText(patient.status)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    disabled={true}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">환자 상태 변경은 별도 기능을 이용해주세요</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주요 진단명
                  </label>
                  <input
                    type="text"
                    value={formData.primary_diagnosis}
                    onChange={(e) => handleInputChange('primary_diagnosis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 우울증, 조현병, 불안장애 등"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주치의
                  </label>
                  <input
                    type="text"
                    value={formData.doctor || ''}
                    onChange={(e) => handleInputChange('doctor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김철수 교수, 이영희 원장 등"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={(formData.contact_info as any)?.phone || ''}
                    onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-1234-5678"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '수정 중...' : '정보 수정'}
                </Button>
              </div>
            </form>
          ) : (
            // 상세보기 모드
            <div className="space-y-6">
              <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-gray-600">
                    {patient.age ? `${patient.age}세` : '나이 정보 없음'} · {getGenderText(patient.gender || '')}
                  </p>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(patient.status)}`}>
                  {getStatusText(patient.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">환자 ID</label>
                      <p className="text-gray-900">{patient.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">생년월일</label>
                      <p className="text-gray-900">{patient.birth_date || '정보 없음'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">등록일</label>
                      <p className="text-gray-900">{patient.registration_date}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">의료 정보</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">진단명</label>
                      <p className="text-gray-900">{patient.diagnosis}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">현재 상태</label>
                      <p className="text-gray-900">{getStatusText(patient.status)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">담당 사회복지사</label>
                      <p className="text-gray-900">
                        {patient.social_worker?.full_name || '미배정'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4 md:col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">연락처 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">환자 연락처</label>
                      <p className="text-gray-900">
                        {patient.contact_info && typeof patient.contact_info === 'object' && 'phone' in patient.contact_info 
                          ? (patient.contact_info as { phone?: string }).phone || '정보 없음'
                          : typeof patient.contact_info === 'string' 
                          ? patient.contact_info 
                          : '정보 없음'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">주치의</label>
                      <p className="text-gray-900">{patient.doctor || '정보 없음'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  닫기
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">환자 정보를 찾을 수 없습니다.</p>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">환자 삭제</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  정말로 <strong>{patient?.name}</strong> 환자를 삭제하시겠습니까?
                </p>
                
                {relatedData.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      ⚠️ 다음 연관 데이터가 발견되었습니다:
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                      {relatedData.map((item, index) => (
                        <li key={index}>{item.count}개의 {item.name}</li>
                      ))}
                    </ul>
                    
                    <div className="mt-3 flex items-center">
                      <input
                        type="checkbox"
                        id="forceDelete"
                        checked={forceDelete}
                        onChange={(e) => setForceDelete(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="forceDelete" className="text-sm text-yellow-800">
                        연관 데이터와 함께 완전히 삭제 (되돌릴 수 없음)
                      </label>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-red-600 mt-2">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting || (relatedData.length > 0 && !forceDelete)}
                >
                  {isDeleting ? '삭제 중...' : 
                   relatedData.length > 0 && !forceDelete ? '강제 삭제 체크 필요' : 
                   forceDelete ? '완전 삭제' : '삭제'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}