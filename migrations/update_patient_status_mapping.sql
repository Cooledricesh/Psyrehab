-- 환자 상태 매핑 변경 마이그레이션
-- inactive -> pending, complete -> discharged

-- 1. 먼저 현재 상태 확인
SELECT status, COUNT(*) as count 
FROM patients 
GROUP BY status
ORDER BY status;

-- 2. 백업 테이블 생성 (안전을 위해)
CREATE TABLE IF NOT EXISTS patients_status_backup AS
SELECT id, status, updated_at
FROM patients;

-- 3. 상태 업데이트
BEGIN;

-- inactive를 pending으로 변경
UPDATE patients 
SET status = 'pending', 
    updated_at = NOW()
WHERE status = 'inactive';

-- complete를 discharged로 변경
UPDATE patients 
SET status = 'discharged', 
    updated_at = NOW()
WHERE status = 'complete' OR status = 'completed';

-- 4. 변경 후 상태 확인
SELECT status, COUNT(*) as count 
FROM patients 
GROUP BY status
ORDER BY status;

COMMIT;

-- 5. 만약 문제가 있으면 롤백
-- ROLLBACK;

-- 6. 롤백이 필요한 경우 아래 쿼리 사용
-- UPDATE patients p
-- SET status = b.status,
--     updated_at = NOW()
-- FROM patients_status_backup b
-- WHERE p.id = b.id;