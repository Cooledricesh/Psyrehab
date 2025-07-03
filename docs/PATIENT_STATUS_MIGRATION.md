# 환자 상태 매핑 변경 가이드

## 변경 사항
- `inactive` → `pending`: 목표 설정 대기 상태
- `complete`/`completed` → `discharged`: 입원 중 상태

## 데이터베이스 마이그레이션
1. `migrations/update_patient_status_mapping.sql` 파일 실행
2. 백업 테이블이 자동으로 생성됨 (patients_status_backup)
3. 문제 발생 시 백업에서 복원 가능

## 코드 변경 사항
### 수정된 파일들:
- `/src/components/PatientUnifiedModal.tsx`: getStatusText, getStatusBadgeColor 함수 업데이트
- `/src/pages/PatientManagement.tsx`: 상태 매핑 로직 변경
- `/src/components/PatientRegistrationModal.tsx`: 기본 상태를 'pending'으로 변경
- `/src/services/socialWorkerDashboard.ts`: pending 환자 제외 로직 추가
- `/src/components/patients/PatientStatusManager.tsx`: 상태 옵션 업데이트
- `/src/pages/GoalSetting.tsx`: pending과 inactive 모두 조회하도록 변경

## 호환성
기존 데이터와의 호환성을 위해 일시적으로 이전 상태값도 인식하도록 처리:
- `inactive` → '목표 설정 대기'로 표시
- `completed` → '입원 중'으로 표시

## 주의사항
- 데이터베이스 마이그레이션 전 반드시 백업 수행
- 프로덕션 환경에서는 점진적 롤아웃 권장