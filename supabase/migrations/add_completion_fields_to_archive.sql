-- 아카이빙 테이블에 완료 관련 필드 추가
ALTER TABLE ai_recommendation_archive 
ADD COLUMN IF NOT EXISTS completion_rate integer,
ADD COLUMN IF NOT EXISTS completion_date date;

-- 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_archive_completion_rate 
ON ai_recommendation_archive(completion_rate DESC NULLS LAST) 
WHERE archived_reason = 'successfully_completed';

CREATE INDEX IF NOT EXISTS idx_archive_completion_date 
ON ai_recommendation_archive(completion_date DESC NULLS LAST) 
WHERE archived_reason = 'successfully_completed';

-- 코멘트 추가
COMMENT ON COLUMN ai_recommendation_archive.completion_rate IS '완료된 목표의 달성률 (0-100)';
COMMENT ON COLUMN ai_recommendation_archive.completion_date IS '목표 완료 날짜';