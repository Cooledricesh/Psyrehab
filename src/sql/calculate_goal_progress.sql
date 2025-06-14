-- 목표 진행률 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_goal_id UUID;
    v_completed_count INTEGER;
    v_total_checked INTEGER; -- 체크된 목표 수 (completed + cancelled)
    v_total_count INTEGER;
    v_progress NUMERIC;
BEGIN
    -- 주간 목표가 업데이트된 경우
    IF NEW.goal_type = 'weekly' THEN
        -- 부모 월간 목표 ID 가져오기
        v_parent_goal_id := NEW.parent_goal_id;
        
        -- 해당 월간 목표의 주간 목표들 중 완료된 개수와 체크된 개수 계산
        SELECT 
            COUNT(*) FILTER (WHERE status = 'completed'),
            COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled')),
            COUNT(*)
        INTO v_completed_count, v_total_checked, v_total_count
        FROM rehabilitation_goals
        WHERE parent_goal_id = v_parent_goal_id
        AND goal_type = 'weekly'
        AND plan_status = 'active';
        
        -- 진행률 계산 (체크된 목표 중에서 완료된 비율)
        IF v_total_checked > 0 THEN
            v_progress := (v_completed_count::NUMERIC / v_total_checked::NUMERIC) * 100;
        ELSE
            v_progress := 0;
        END IF;
        
        -- 월간 목표 진행률 업데이트
        UPDATE rehabilitation_goals
        SET progress = v_progress,
            updated_at = NOW()
        WHERE id = v_parent_goal_id;
    END IF;
    
    -- 월간 목표가 업데이트된 경우
    IF NEW.goal_type = 'monthly' OR (OLD.goal_type = 'monthly' AND NEW.progress != OLD.progress) THEN
        -- 부모 6개월 목표 ID 가져오기
        SELECT parent_goal_id INTO v_parent_goal_id
        FROM rehabilitation_goals
        WHERE id = CASE 
            WHEN NEW.goal_type = 'monthly' THEN NEW.id 
            ELSE NEW.parent_goal_id 
        END;
        
        -- 해당 6개월 목표의 월간 목표들의 평균 진행률 계산
        SELECT AVG(progress)
        INTO v_progress
        FROM rehabilitation_goals
        WHERE parent_goal_id = v_parent_goal_id
        AND goal_type = 'monthly'
        AND plan_status = 'active';
        
        -- 6개월 목표 진행률 업데이트
        UPDATE rehabilitation_goals
        SET progress = COALESCE(v_progress, 0),
            updated_at = NOW()
        WHERE id = v_parent_goal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_calculate_goal_progress ON rehabilitation_goals;
CREATE TRIGGER trigger_calculate_goal_progress
AFTER UPDATE OF status, progress ON rehabilitation_goals
FOR EACH ROW
EXECUTE FUNCTION calculate_goal_progress();