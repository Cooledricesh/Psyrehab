-- 기존 완료된 목표들을 ai_recommendation_archive 테이블로 마이그레이션하는 SQL

-- 1. 먼저 이미 아카이빙된 목표 확인
SELECT COUNT(*) as already_archived_count
FROM ai_recommendation_archive
WHERE archived_reason = 'successfully_completed';

-- 2. 아카이빙할 완료된 목표들 미리보기
WITH completed_goals AS (
  SELECT 
    rg.id as goal_id,
    rg.title,
    rg.patient_id,
    rg.source_recommendation_id,
    rg.actual_completion_rate,
    rg.completion_date,
    p.birth_date,
    p.gender,
    p.diagnosis
  FROM rehabilitation_goals rg
  JOIN patients p ON p.id = rg.patient_id
  WHERE rg.goal_type = 'six_month' 
    AND rg.status = 'completed'
    AND rg.id NOT IN (
      SELECT DISTINCT parent_goal_id::uuid
      FROM ai_recommendation_archive 
      WHERE parent_goal_id IS NOT NULL
    )
)
SELECT COUNT(*) as goals_to_archive FROM completed_goals;

-- 3. 실제 마이그레이션 수행
-- 주의: 이 쿼리는 기존 목표들의 계층 구조를 재구성합니다
INSERT INTO ai_recommendation_archive (
  original_recommendation_id,
  original_assessment_id,
  archived_goal_data,
  patient_age_range,
  patient_gender,
  diagnosis_category,
  archived_reason,
  completion_rate,
  completion_date,
  archived_at
)
SELECT 
  rg_six.source_recommendation_id,
  COALESCE(rg_six.source_recommendation_id, gen_random_uuid()::text),
  jsonb_build_array(
    jsonb_build_object(
      'plan_number', 1,
      'title', rg_six.title,
      'purpose', COALESCE(rg_six.description, '성공적으로 완료된 재활 목표'),
      'sixMonthGoal', rg_six.title,
      'monthlyGoals', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'month', mg.sequence_number,
            'goal', mg.title
          ) ORDER BY mg.sequence_number
        )
        FROM rehabilitation_goals mg
        WHERE mg.parent_goal_id = rg_six.id
          AND mg.goal_type = 'monthly'
      ),
      'weeklyPlans', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'week', wg.sequence_number,
            'month', mg.sequence_number,
            'plan', wg.title
          ) ORDER BY mg.sequence_number, wg.sequence_number
        )
        FROM rehabilitation_goals wg
        JOIN rehabilitation_goals mg ON mg.id = wg.parent_goal_id
        WHERE mg.parent_goal_id = rg_six.id
          AND wg.goal_type = 'weekly'
          AND mg.goal_type = 'monthly'
      )
    )
  ),
  -- 연령대 계산
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 20 THEN '0-19'
    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 30 THEN '20-29'
    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 40 THEN '30-39'
    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 50 THEN '40-49'
    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 60 THEN '50-59'
    WHEN EXTRACT(YEAR FROM AGE(p.birth_date)) < 70 THEN '60-69'
    ELSE '70+'
  END,
  p.gender,
  -- 진단 카테고리 매핑
  CASE 
    WHEN LOWER(p.diagnosis) LIKE '%치매%' OR LOWER(p.diagnosis) LIKE '%인지%' OR LOWER(p.diagnosis) LIKE '%dementia%' THEN 'cognitive_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%우울%' OR LOWER(p.diagnosis) LIKE '%조울%' OR LOWER(p.diagnosis) LIKE '%depression%' THEN 'mood_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%불안%' OR LOWER(p.diagnosis) LIKE '%공황%' OR LOWER(p.diagnosis) LIKE '%anxiety%' THEN 'anxiety_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%조현병%' OR LOWER(p.diagnosis) LIKE '%정신분열%' OR LOWER(p.diagnosis) LIKE '%schizophrenia%' THEN 'psychotic_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%중독%' OR LOWER(p.diagnosis) LIKE '%알코올%' OR LOWER(p.diagnosis) LIKE '%addiction%' THEN 'substance_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%자폐%' OR LOWER(p.diagnosis) LIKE '%발달%' OR LOWER(p.diagnosis) LIKE '%autism%' THEN 'developmental_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%뇌졸중%' OR LOWER(p.diagnosis) LIKE '%파킨슨%' OR LOWER(p.diagnosis) LIKE '%stroke%' THEN 'neurological_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%성격%' OR LOWER(p.diagnosis) LIKE '%인격%' OR LOWER(p.diagnosis) LIKE '%personality%' THEN 'personality_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%섭식%' OR LOWER(p.diagnosis) LIKE '%식이%' OR LOWER(p.diagnosis) LIKE '%eating%' THEN 'eating_disorder'
    WHEN LOWER(p.diagnosis) LIKE '%외상%' OR LOWER(p.diagnosis) LIKE '%트라우마%' OR LOWER(p.diagnosis) LIKE '%trauma%' THEN 'trauma_disorder'
    ELSE 'other_disorder'
  END,
  'successfully_completed',
  COALESCE(rg_six.actual_completion_rate, 100),
  rg_six.completion_date,
  COALESCE(rg_six.completion_date::timestamp with time zone, rg_six.updated_at)
FROM rehabilitation_goals rg_six
JOIN patients p ON p.id = rg_six.patient_id
WHERE rg_six.goal_type = 'six_month' 
  AND rg_six.status = 'completed'
  -- 이미 아카이빙된 목표는 제외
  AND NOT EXISTS (
    SELECT 1 
    FROM ai_recommendation_archive ara
    WHERE ara.original_recommendation_id = rg_six.source_recommendation_id
      AND ara.archived_reason = 'successfully_completed'
  )
  -- 월간/주간 목표가 있는 것만 아카이빙
  AND EXISTS (
    SELECT 1
    FROM rehabilitation_goals mg
    WHERE mg.parent_goal_id = rg_six.id
      AND mg.goal_type = 'monthly'
  );

-- 4. 마이그레이션 결과 확인
SELECT 
  COUNT(*) as total_archived,
  COUNT(CASE WHEN archived_reason = 'successfully_completed' THEN 1 END) as completed_goals,
  COUNT(CASE WHEN archived_reason = 'goal_not_selected' THEN 1 END) as unselected_goals
FROM ai_recommendation_archive;

-- 5. 성공적으로 아카이빙된 목표 샘플 확인
SELECT 
  id,
  archived_goal_data->0->>'title' as goal_title,
  patient_age_range,
  patient_gender,
  diagnosis_category,
  completion_rate,
  completion_date,
  archived_at
FROM ai_recommendation_archive
WHERE archived_reason = 'successfully_completed'
ORDER BY completion_date DESC
LIMIT 5;