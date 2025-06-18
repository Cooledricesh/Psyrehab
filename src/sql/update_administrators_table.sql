-- administrators 테이블에 누락된 컬럼 추가
ALTER TABLE administrators 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);

-- 컬럼 설명 추가
COMMENT ON COLUMN administrators.employee_id IS '직원번호';
COMMENT ON COLUMN administrators.department IS '부서';
COMMENT ON COLUMN administrators.contact_number IS '연락처';
