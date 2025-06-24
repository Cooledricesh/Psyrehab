-- AI 추천 아카이빙 테이블 생성
CREATE TABLE IF NOT EXISTS ai_recommendation_archive (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 원본 추천 참조 (NULL 허용 - 익명화를 위해)
    original_recommendation_id TEXT,
    original_assessment_id TEXT NOT NULL,
    
    -- 아카이빙된 목표 데이터 (JSONB로 저장)
    archived_goal_data JSONB NOT NULL,
    
    -- 익명화된 환자 메타데이터
    patient_age_range TEXT, -- 예: "20-29", "30-39"
    patient_gender TEXT, -- 예: "M", "F", "Other"
    diagnosis_category TEXT, -- 예: "cognitive_disorder", "mood_disorder"
    
    -- 아카이빙 메타데이터
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_reason TEXT DEFAULT 'goal_not_selected', -- 'goal_not_selected', 'recommendation_rejected'
    
    -- 분석을 위한 추가 필드
    goal_category TEXT, -- 목표 카테고리 (자동 분류)
    goal_complexity_score INTEGER, -- 1-10 복잡도 점수
    
    -- 시스템 필드
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_archived_at 
    ON ai_recommendation_archive(archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_goal_category 
    ON ai_recommendation_archive(goal_category);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_diagnosis_category 
    ON ai_recommendation_archive(diagnosis_category);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_age_range 
    ON ai_recommendation_archive(patient_age_range);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_archive_archived_reason 
    ON ai_recommendation_archive(archived_reason);

-- RLS (Row Level Security) 활성화
ALTER TABLE ai_recommendation_archive ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능한 정책
CREATE POLICY "ai_recommendation_archive_admin_access" ON ai_recommendation_archive
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 통계 조회를 위한 읽기 전용 정책 (필요시)
CREATE POLICY "ai_recommendation_archive_stats_read" ON ai_recommendation_archive
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin' OR
                auth.users.raw_user_meta_data->>'role' = 'therapist'
            )
        )
    );

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_ai_recommendation_archive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 적용
CREATE TRIGGER trigger_update_ai_recommendation_archive_updated_at
    BEFORE UPDATE ON ai_recommendation_archive
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_recommendation_archive_updated_at();

-- 테이블 코멘트 추가
COMMENT ON TABLE ai_recommendation_archive IS 'AI 추천 목표 아카이빙 테이블 - 선택되지 않은 목표들을 익명화하여 저장';
COMMENT ON COLUMN ai_recommendation_archive.original_recommendation_id IS '원본 추천 ID (익명화 목적으로 NULL 허용)';
COMMENT ON COLUMN ai_recommendation_archive.archived_goal_data IS '아카이빙된 목표 데이터 (JSONB 형태)';
COMMENT ON COLUMN ai_recommendation_archive.patient_age_range IS '환자 연령대 (익명화)';
COMMENT ON COLUMN ai_recommendation_archive.diagnosis_category IS '진단 카테고리 (익명화)';
COMMENT ON COLUMN ai_recommendation_archive.goal_category IS '목표 카테고리 (자동 분류)';
COMMENT ON COLUMN ai_recommendation_archive.goal_complexity_score IS '목표 복잡도 점수 (1-10)'; 