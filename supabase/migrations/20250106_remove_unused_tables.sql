-- 사용하지 않는 테이블 삭제
-- 이 테이블들은 코드에는 있지만 실제로 사용되지 않고 있음

-- 1. assessment_history 테이블 삭제
DROP TABLE IF EXISTS assessment_history CASCADE;

-- 2. assessment_milestones 테이블 삭제
DROP TABLE IF EXISTS assessment_milestones CASCADE;

-- 3. detailed_assessments 테이블 삭제
DROP TABLE IF EXISTS detailed_assessments CASCADE;

-- 4. progress_insights 테이블 삭제
DROP TABLE IF EXISTS progress_insights CASCADE;

-- 관련 인덱스, 트리거, 함수들도 CASCADE로 자동 삭제됨