## 로그를 분석한 결과, 중복 삭제 로직이 문제입니다.

  문제 발견:

  1. 첫 번째 삭제 (PatientManagement.tsx):
    - 31개 목표 조회됨
    - 31개 목표 삭제 성공
  2. 두 번째 삭제 (patient-management.ts):
    - 0개 목표 조회됨 (이미 삭제되었기 때문)
    - "삭제할 목표가 없음"
  
  개선 제안:

  1. PatientManagement.tsx에서 목표 삭제 로직 제거 (권장)
    - 서비스 레이어에서만 처리하도록 통일
  2. 또는 patient-management.ts에서 목표 삭제 로직 제거
    - UI 레이어에서만 처리