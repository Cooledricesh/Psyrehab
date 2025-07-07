-- ai_recommendation_archive 테이블에 통계 컬럼 추가
ALTER TABLE ai_recommendation_archive
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate INTEGER DEFAULT NULL;

-- 인덱스 추가 (정렬 성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_usage_count ON ai_recommendation_archive(usage_count);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_completion_count ON ai_recommendation_archive(completion_count);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_completion_rate ON ai_recommendation_archive(completion_rate);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_archived_reason ON ai_recommendation_archive(archived_reason);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_diagnosis_category ON ai_recommendation_archive(diagnosis_category);

-- 기존 데이터에 대한 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_archive_stats()
RETURNS void AS $$
DECLARE
    archive_record RECORD;
    usage_cnt INTEGER;
    completion_cnt INTEGER;
    avg_rate INTEGER;
BEGIN
    -- 모든 아카이빙 레코드 순회
    FOR archive_record IN 
        SELECT id, original_recommendation_id, archived_goal_data, archived_reason
        FROM ai_recommendation_archive
    LOOP
        usage_cnt := 0;
        completion_cnt := 0;
        avg_rate := NULL;
        
        -- successfully_completed 인 경우
        IF archive_record.archived_reason = 'successfully_completed' AND 
           archive_record.archived_goal_data IS NOT NULL AND 
           jsonb_array_length(archive_record.archived_goal_data) > 0 THEN
            
            -- 첫 번째 목표의 6개월 목표 제목 추출
            DECLARE
                six_month_goal TEXT;
            BEGIN
                six_month_goal := archive_record.archived_goal_data->0->>'sixMonthGoal';
                
                IF six_month_goal IS NOT NULL THEN
                    -- 해당 제목과 일치하는 목표들 조회
                    SELECT 
                        COUNT(DISTINCT patient_id),
                        COUNT(DISTINCT CASE WHEN status = 'completed' THEN patient_id END),
                        AVG(CASE WHEN status = 'completed' THEN actual_completion_rate END)::INTEGER
                    INTO usage_cnt, completion_cnt, avg_rate
                    FROM rehabilitation_goals
                    WHERE goal_type = 'six_month'
                    AND title = six_month_goal;
                END IF;
            END;
        
        -- original_recommendation_id가 있는 경우
        ELSIF archive_record.original_recommendation_id IS NOT NULL THEN
            SELECT 
                COUNT(DISTINCT patient_id),
                COUNT(DISTINCT CASE WHEN status = 'completed' THEN patient_id END),
                AVG(CASE WHEN status = 'completed' THEN actual_completion_rate END)::INTEGER
            INTO usage_cnt, completion_cnt, avg_rate
            FROM rehabilitation_goals
            WHERE goal_type = 'six_month'
            AND source_recommendation_id = archive_record.original_recommendation_id;
        END IF;
        
        -- 통계 업데이트
        UPDATE ai_recommendation_archive
        SET 
            usage_count = usage_cnt,
            completion_count = completion_cnt,
            completion_rate = avg_rate
        WHERE id = archive_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 초기 통계 업데이트 실행
SELECT update_archive_stats();

-- 목표가 생성될 때 통계 업데이트하는 트리거 함수
CREATE OR REPLACE FUNCTION update_archive_stats_on_goal_change()
RETURNS TRIGGER AS $$
DECLARE
    archive_record RECORD;
BEGIN
    -- 새로운 목표가 생성되거나 상태가 변경된 경우
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status)) 
       AND NEW.goal_type = 'six_month' THEN
        
        -- source_recommendation_id로 아카이브 찾기
        IF NEW.source_recommendation_id IS NOT NULL THEN
            FOR archive_record IN 
                SELECT id FROM ai_recommendation_archive 
                WHERE original_recommendation_id = NEW.source_recommendation_id
            LOOP
                PERFORM update_single_archive_stats(archive_record.id);
            END LOOP;
        END IF;
        
        -- 제목으로 아카이브 찾기 (successfully_completed 인 경우)
        FOR archive_record IN 
            SELECT id FROM ai_recommendation_archive 
            WHERE archived_reason = 'successfully_completed'
            AND archived_goal_data->0->>'sixMonthGoal' = NEW.title
        LOOP
            PERFORM update_single_archive_stats(archive_record.id);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 단일 아카이브 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_single_archive_stats(archive_id UUID)
RETURNS void AS $$
DECLARE
    archive_record RECORD;
    usage_cnt INTEGER;
    completion_cnt INTEGER;
    avg_rate INTEGER;
BEGIN
    SELECT * INTO archive_record FROM ai_recommendation_archive WHERE id = archive_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    usage_cnt := 0;
    completion_cnt := 0;
    avg_rate := NULL;
    
    -- successfully_completed 인 경우
    IF archive_record.archived_reason = 'successfully_completed' AND 
       archive_record.archived_goal_data IS NOT NULL AND 
       jsonb_array_length(archive_record.archived_goal_data) > 0 THEN
        
        DECLARE
            six_month_goal TEXT;
        BEGIN
            six_month_goal := archive_record.archived_goal_data->0->>'sixMonthGoal';
            
            IF six_month_goal IS NOT NULL THEN
                SELECT 
                    COUNT(DISTINCT patient_id),
                    COUNT(DISTINCT CASE WHEN status = 'completed' THEN patient_id END),
                    AVG(CASE WHEN status = 'completed' THEN actual_completion_rate END)::INTEGER
                INTO usage_cnt, completion_cnt, avg_rate
                FROM rehabilitation_goals
                WHERE goal_type = 'six_month'
                AND title = six_month_goal;
            END IF;
        END;
    
    -- original_recommendation_id가 있는 경우
    ELSIF archive_record.original_recommendation_id IS NOT NULL THEN
        SELECT 
            COUNT(DISTINCT patient_id),
            COUNT(DISTINCT CASE WHEN status = 'completed' THEN patient_id END),
            AVG(CASE WHEN status = 'completed' THEN actual_completion_rate END)::INTEGER
        INTO usage_cnt, completion_cnt, avg_rate
        FROM rehabilitation_goals
        WHERE goal_type = 'six_month'
        AND source_recommendation_id = archive_record.original_recommendation_id;
    END IF;
    
    -- 통계 업데이트
    UPDATE ai_recommendation_archive
    SET 
        usage_count = usage_cnt,
        completion_count = completion_cnt,
        completion_rate = avg_rate,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = archive_id;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_archive_stats_trigger ON rehabilitation_goals;
CREATE TRIGGER update_archive_stats_trigger
AFTER INSERT OR UPDATE ON rehabilitation_goals
FOR EACH ROW
EXECUTE FUNCTION update_archive_stats_on_goal_change();

-- 아카이브가 생성될 때 초기 통계 설정하는 트리거
CREATE OR REPLACE FUNCTION init_archive_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- goal_not_selected인 경우 0으로 초기화
    IF NEW.archived_reason = 'goal_not_selected' THEN
        NEW.usage_count := 0;
        NEW.completion_count := 0;
        NEW.completion_rate := NULL;
    ELSE
        -- 다른 경우는 생성 직후 통계 계산
        PERFORM update_single_archive_stats(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS init_archive_stats_trigger ON ai_recommendation_archive;
CREATE TRIGGER init_archive_stats_trigger
AFTER INSERT ON ai_recommendation_archive
FOR EACH ROW
EXECUTE FUNCTION init_archive_stats();