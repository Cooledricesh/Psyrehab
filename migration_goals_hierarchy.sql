-- Migration: Enhanced Hierarchical Goal Management System (Technical Doc Compliant)
-- 문서 스펙에 맞춘 계층적 목표 관리 시스템

-- 1. Goal Categories 테이블 생성 (문서 스펙)
CREATE TABLE IF NOT EXISTS goal_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- HEX 색상 코드
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 카테고리 데이터 삽입
INSERT INTO goal_categories (name, description, icon, color) VALUES
  ('physical_therapy', '물리치료 및 운동능력 향상', '🏃‍♂️', '#FF6B6B'),
  ('cognitive_training', '인지능력 및 기억력 향상', '🧠', '#4ECDC4'),
  ('social_skills', '사회성 및 대인관계 기술', '👥', '#45B7D1'),
  ('emotional_regulation', '감정조절 및 스트레스 관리', '💝', '#96CEB4'),
  ('daily_living', '일상생활 기능 향상', '🏠', '#FFEAA7'),
  ('communication', '의사소통 및 언어능력', '💬', '#DDA0DD'),
  ('vocational', '직업훈련 및 업무능력', '💼', '#98D8C8'),
  ('educational', '교육 및 학습능력', '📚', '#F7DC6F'),
  ('behavioral', '행동수정 및 습관개선', '🎯', '#BB8FCE'),
  ('other', '기타', '📋', '#95A5A6')
ON CONFLICT (name) DO NOTHING;

-- 2. 기존 rehabilitation_goals 테이블 구조 수정
-- 문서 스펙에 맞춰 컬럼 추가/수정

-- 컬럼 추가
ALTER TABLE rehabilitation_goals 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES goal_categories(id),
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(20) DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS sequence_number INTEGER,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS actual_completion_rate INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_completion_rate INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS is_ai_suggested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_recommendation_id UUID,
ADD COLUMN IF NOT EXISTS is_from_ai_recommendation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by_social_worker_id UUID;

-- 기존 컬럼 타입 조정 (필요한 경우)
-- goal_type ENUM 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_type_enum') THEN
        CREATE TYPE goal_type_enum AS ENUM ('six_month', 'monthly', 'weekly');
    END IF;
END $$;

-- status ENUM 수정 (문서 스펙에 맞춤)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status_enum') THEN
        DROP TYPE goal_status_enum CASCADE;
    END IF;
    CREATE TYPE goal_status_enum AS ENUM ('pending', 'active', 'completed', 'on_hold', 'cancelled');
END $$;

-- priority ENUM 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_priority_enum') THEN
        CREATE TYPE goal_priority_enum AS ENUM ('high', 'medium', 'low');
    END IF;
END $$;

-- 컬럼 타입 변경
ALTER TABLE rehabilitation_goals 
ALTER COLUMN goal_type TYPE goal_type_enum USING goal_type::goal_type_enum,
ALTER COLUMN status TYPE goal_status_enum USING status::goal_status_enum,
ALTER COLUMN priority TYPE goal_priority_enum USING priority::goal_priority_enum;

-- 3. Weekly Check-ins 테이블 생성 (문서 스펙)
CREATE TABLE IF NOT EXISTS weekly_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES rehabilitation_goals(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_notes TEXT,
  obstacles_faced TEXT,
  support_needed TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  checked_by UUID NOT NULL, -- social_worker user_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(goal_id, week_number)
);

-- 4. Goal Evaluations 테이블 생성 (문서 스펙)
CREATE TABLE IF NOT EXISTS goal_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES rehabilitation_goals(id) ON DELETE CASCADE,
  evaluation_type VARCHAR(20) NOT NULL CHECK (evaluation_type IN ('weekly', 'monthly', 'six_month')),
  evaluation_date DATE NOT NULL,
  completion_rate INTEGER CHECK (completion_rate >= 0 AND completion_rate <= 100),
  evaluation_notes TEXT,
  strengths JSONB,
  challenges JSONB,
  next_steps JSONB,
  evaluated_by UUID NOT NULL, -- social_worker user_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Goal History 테이블 생성 (문서 스펙)
CREATE TABLE IF NOT EXISTS goal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES rehabilitation_goals(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL, -- social_worker user_id
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('created', 'updated', 'status_changed', 'completed')),
  previous_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 제약조건 추가
ALTER TABLE rehabilitation_goals 
ADD CONSTRAINT check_goal_type CHECK (goal_type IN ('six_month', 'monthly', 'weekly')),
ADD CONSTRAINT check_status CHECK (status IN ('pending', 'active', 'completed', 'on_hold', 'cancelled')),
ADD CONSTRAINT check_priority CHECK (priority IN ('high', 'medium', 'low')),
ADD CONSTRAINT check_progress CHECK (progress >= 0 AND progress <= 100),
ADD CONSTRAINT check_actual_completion_rate CHECK (actual_completion_rate >= 0 AND actual_completion_rate <= 100),
ADD CONSTRAINT check_target_completion_rate CHECK (target_completion_rate >= 0 AND target_completion_rate <= 100);

-- 7. 인덱스 생성 (문서 스펙 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_patient_type ON rehabilitation_goals(patient_id, goal_type);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_parent_status ON rehabilitation_goals(parent_goal_id, status);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_category ON rehabilitation_goals(category_id);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_social_worker ON rehabilitation_goals(created_by_social_worker_id);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_sequence ON rehabilitation_goals(patient_id, goal_type, sequence_number);

CREATE INDEX IF NOT EXISTS idx_weekly_check_ins_goal ON weekly_check_ins(goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_check_ins_date ON weekly_check_ins(check_in_date);

CREATE INDEX IF NOT EXISTS idx_goal_evaluations_goal ON goal_evaluations(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_evaluations_type_date ON goal_evaluations(evaluation_type, evaluation_date);

CREATE INDEX IF NOT EXISTS idx_goal_history_goal ON goal_history(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_history_date ON goal_history(created_at);

-- 8. 함수 생성 (문서 스펙)

-- 목표 완료율 계산 함수
CREATE OR REPLACE FUNCTION calculate_goal_completion_rate(goal_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_rate INTEGER;
    child_count INTEGER;
    completed_count INTEGER;
BEGIN
    -- 하위 목표 개수 조회
    SELECT COUNT(*) INTO child_count
    FROM rehabilitation_goals 
    WHERE parent_goal_id = goal_uuid;
    
    -- 하위 목표가 없으면 현재 progress 반환
    IF child_count = 0 THEN
        SELECT progress INTO completion_rate
        FROM rehabilitation_goals 
        WHERE id = goal_uuid;
        RETURN COALESCE(completion_rate, 0);
    END IF;
    
    -- 완료된 하위 목표 개수 조회
    SELECT COUNT(*) INTO completed_count
    FROM rehabilitation_goals 
    WHERE parent_goal_id = goal_uuid AND status = 'completed';
    
    -- 완료율 계산
    completion_rate := ROUND((completed_count::DECIMAL / child_count::DECIMAL) * 100);
    
    -- 상위 목표 progress 업데이트
    UPDATE rehabilitation_goals 
    SET progress = completion_rate,
        actual_completion_rate = completion_rate,
        updated_at = NOW()
    WHERE id = goal_uuid;
    
    RETURN completion_rate;
END;
$$ LANGUAGE plpgsql;

-- 목표 계층 검증 함수
CREATE OR REPLACE FUNCTION validate_goal_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    -- 6개월 목표는 parent가 없어야 함
    IF NEW.goal_type = 'six_month' AND NEW.parent_goal_id IS NOT NULL THEN
        RAISE EXCEPTION 'Six month goals cannot have a parent goal';
    END IF;
    
    -- 월간 목표는 6개월 목표를 parent로 가져야 함
    IF NEW.goal_type = 'monthly' THEN
        IF NEW.parent_goal_id IS NULL THEN
            RAISE EXCEPTION 'Monthly goals must have a six month parent goal';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM rehabilitation_goals 
            WHERE id = NEW.parent_goal_id AND goal_type = 'six_month'
        ) THEN
            RAISE EXCEPTION 'Monthly goals parent must be a six month goal';
        END IF;
    END IF;
    
    -- 주간 목표는 월간 목표를 parent로 가져야 함
    IF NEW.goal_type = 'weekly' THEN
        IF NEW.parent_goal_id IS NULL THEN
            RAISE EXCEPTION 'Weekly goals must have a monthly parent goal';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM rehabilitation_goals 
            WHERE id = NEW.parent_goal_id AND goal_type = 'monthly'
        ) THEN
            RAISE EXCEPTION 'Weekly goals parent must be a monthly goal';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 생성

-- 목표 계층 검증 트리거
CREATE TRIGGER trigger_validate_goal_hierarchy
    BEFORE INSERT OR UPDATE ON rehabilitation_goals
    FOR EACH ROW EXECUTE FUNCTION validate_goal_hierarchy();

-- 목표 히스토리 기록 트리거
CREATE OR REPLACE FUNCTION record_goal_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO goal_history (goal_id, changed_by, change_type, new_values)
        VALUES (NEW.id, NEW.created_by_social_worker_id, 'created', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO goal_history (goal_id, changed_by, change_type, previous_values, new_values, change_reason)
        VALUES (NEW.id, NEW.created_by_social_worker_id, 'updated', to_jsonb(OLD), to_jsonb(NEW), 'Goal updated');
        
        -- 상태 변경 시 별도 기록
        IF OLD.status != NEW.status THEN
            INSERT INTO goal_history (goal_id, changed_by, change_type, previous_values, new_values, change_reason)
            VALUES (NEW.id, NEW.created_by_social_worker_id, 'status_changed', 
                   jsonb_build_object('status', OLD.status), 
                   jsonb_build_object('status', NEW.status), 
                   'Status changed from ' || OLD.status || ' to ' || NEW.status);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_goal_history
    AFTER INSERT OR UPDATE ON rehabilitation_goals
    FOR EACH ROW EXECUTE FUNCTION record_goal_history();

-- 목표 완료 시 상위 목표 진행률 업데이트 트리거
CREATE OR REPLACE FUNCTION update_goal_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- 목표가 완료되었을 때 상위 목표 진행률 업데이트
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- 상위 목표가 있으면 진행률 재계산
        IF NEW.parent_goal_id IS NOT NULL THEN
            PERFORM calculate_goal_completion_rate(NEW.parent_goal_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_completion
    AFTER UPDATE ON rehabilitation_goals
    FOR EACH ROW EXECUTE FUNCTION update_goal_completion();

-- 10. 뷰 생성 (문서 스펙)

-- 목표 계층 구조 뷰
CREATE OR REPLACE VIEW goal_hierarchy AS
WITH RECURSIVE goal_tree AS (
    -- 6개월 목표 (최상위)
    SELECT 
        id, patient_id, title, description, goal_type, 
        status, progress, actual_completion_rate, target_completion_rate,
        category_id, priority, sequence_number,
        start_date, end_date, parent_goal_id,
        0 as level, ARRAY[sequence_number] as path
    FROM rehabilitation_goals 
    WHERE goal_type = 'six_month'
    
    UNION ALL
    
    -- 하위 목표들
    SELECT 
        r.id, r.patient_id, r.title, r.description, r.goal_type,
        r.status, r.progress, r.actual_completion_rate, r.target_completion_rate,
        r.category_id, r.priority, r.sequence_number,
        r.start_date, r.end_date, r.parent_goal_id,
        gt.level + 1, gt.path || r.sequence_number
    FROM rehabilitation_goals r
    JOIN goal_tree gt ON r.parent_goal_id = gt.id
)
SELECT 
    gt.*,
    gc.name as category_name,
    gc.icon as category_icon,
    gc.color as category_color
FROM goal_tree gt
LEFT JOIN goal_categories gc ON gt.category_id = gc.id
ORDER BY gt.path;

-- 환자별 현재 진행 상황 뷰
CREATE OR REPLACE VIEW patient_current_progress AS
SELECT 
    p.id as patient_id,
    p.full_name as patient_name,
    COUNT(CASE WHEN rg.goal_type = 'six_month' THEN 1 END) as six_month_goals,
    COUNT(CASE WHEN rg.goal_type = 'monthly' THEN 1 END) as monthly_goals,
    COUNT(CASE WHEN rg.goal_type = 'weekly' THEN 1 END) as weekly_goals,
    COUNT(CASE WHEN rg.status = 'active' THEN 1 END) as active_goals,
    COUNT(CASE WHEN rg.status = 'completed' THEN 1 END) as completed_goals,
    ROUND(AVG(rg.progress), 2) as average_progress,
    ROUND(AVG(rg.actual_completion_rate), 2) as average_completion_rate,
    MAX(rg.updated_at) as last_activity
FROM patients p
LEFT JOIN rehabilitation_goals rg ON p.id = rg.patient_id
GROUP BY p.id, p.full_name;

-- 11. RLS 정책 적용 (보안)

-- Goal Categories RLS
ALTER TABLE goal_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Goal categories are viewable by authenticated users" ON goal_categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Goal categories are manageable by administrators" ON goal_categories
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.id 
                WHERE ur.user_id = auth.uid() AND r.role_name = 'administrator')
    );

-- Weekly Check-ins RLS
ALTER TABLE weekly_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly check-ins are viewable by related users" ON weekly_check_ins
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg 
            JOIN patients p ON rg.patient_id = p.id
            WHERE rg.id = weekly_check_ins.goal_id
            AND (
                p.user_id = auth.uid() OR
                p.primary_social_worker_id = auth.uid() OR
                EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                       WHERE ur.user_id = auth.uid() AND r.role_name = 'administrator')
            )
        )
    );

CREATE POLICY "Weekly check-ins are manageable by social workers" ON weekly_check_ins
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg 
            JOIN patients p ON rg.patient_id = p.id
            WHERE rg.id = weekly_check_ins.goal_id
            AND (
                p.primary_social_worker_id = auth.uid() OR
                EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                       WHERE ur.user_id = auth.uid() AND r.role_name IN ('administrator', 'social_worker'))
            )
        )
    );

-- Goal Evaluations RLS (similar pattern)
ALTER TABLE goal_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Goal evaluations are viewable by related users" ON goal_evaluations
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg 
            JOIN patients p ON rg.patient_id = p.id
            WHERE rg.id = goal_evaluations.goal_id
            AND (
                p.user_id = auth.uid() OR
                p.primary_social_worker_id = auth.uid() OR
                EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                       WHERE ur.user_id = auth.uid() AND r.role_name = 'administrator')
            )
        )
    );

-- Goal History RLS (similar pattern)
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Goal history is viewable by related users" ON goal_history
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg 
            JOIN patients p ON rg.patient_id = p.id
            WHERE rg.id = goal_history.goal_id
            AND (
                p.user_id = auth.uid() OR
                p.primary_social_worker_id = auth.uid() OR
                EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id 
                       WHERE ur.user_id = auth.uid() AND r.role_name = 'administrator')
            )
        )
    );

-- 12. Updated_at 트리거 적용
CREATE TRIGGER update_goal_categories_updated_at
    BEFORE UPDATE ON goal_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_check_ins_updated_at
    BEFORE UPDATE ON weekly_check_ins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_evaluations_updated_at
    BEFORE UPDATE ON goal_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 샘플 데이터 업데이트 (기존 데이터와 호환성 유지)
-- 기존 rehabilitation_goals 테이블에 category_id 설정
UPDATE rehabilitation_goals 
SET category_id = (SELECT id FROM goal_categories WHERE name = 'other')
WHERE category_id IS NULL;

-- goal_type 기본값 설정
UPDATE rehabilitation_goals 
SET goal_type = 'weekly'
WHERE goal_type IS NULL;

-- 기본 완료율 설정
UPDATE rehabilitation_goals 
SET actual_completion_rate = progress,
    target_completion_rate = 100
WHERE actual_completion_rate IS NULL OR target_completion_rate IS NULL;

COMMENT ON TABLE goal_categories IS '목표 카테고리 관리 테이블 (문서 스펙)';
COMMENT ON TABLE weekly_check_ins IS '주간 체크인 기록 테이블 (문서 스펙)';
COMMENT ON TABLE goal_evaluations IS '목표 평가 기록 테이블 (문서 스펙)';
COMMENT ON TABLE goal_history IS '목표 변경 이력 추적 테이블 (문서 스펙)';
COMMENT ON VIEW goal_hierarchy IS '계층적 목표 구조 뷰';
COMMENT ON VIEW patient_current_progress IS '환자별 현재 진행 상황 요약 뷰'; 