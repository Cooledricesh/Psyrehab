-- Test script to verify AI recommendation archive stats update on goal deletion

-- Step 1: Check current archive stats
SELECT 
    id,
    archived_reason,
    usage_count,
    completion_count,
    archived_goal_data->0->>'sixMonthGoal' AS six_month_goal_title,
    updated_at
FROM ai_recommendation_archive
WHERE archived_reason = 'initial_generation'
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Create a test 6-month goal
INSERT INTO rehabilitation_goals (
    id,
    patient_id,
    title,
    description,
    goal_type,
    status,
    start_date,
    end_date,
    created_by_social_worker_id,
    source_recommendation_id
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM patients LIMIT 1), -- Use any existing patient
    '매주 가족과 활동하기', -- This matches one of the archived goals
    'Test goal for trigger verification',
    'six_month',
    'active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    (SELECT user_id FROM social_workers LIMIT 1), -- Use any existing social worker
    '2c919438-bdd3-485d-8c9e-b28cabcfb006' -- This matches the original_recommendation_id
);

-- Step 3: Check archive stats after INSERT (should show usage_count = 1)
SELECT 
    id,
    archived_reason,
    usage_count,
    completion_count,
    archived_goal_data->0->>'sixMonthGoal' AS six_month_goal_title,
    updated_at
FROM ai_recommendation_archive
WHERE original_recommendation_id = '2c919438-bdd3-485d-8c9e-b28cabcfb006'
   OR archived_goal_data->0->>'sixMonthGoal' = '매주 가족과 활동하기';

-- Step 4: Update the goal to 'deleted' status (soft delete)
UPDATE rehabilitation_goals
SET status = 'deleted',
    updated_at = NOW()
WHERE title = '매주 가족과 활동하기'
  AND goal_type = 'six_month'
  AND created_at >= CURRENT_DATE;

-- Step 5: Check archive stats after soft DELETE (should show usage_count = 0)
SELECT 
    id,
    archived_reason,
    usage_count,
    completion_count,
    archived_goal_data->0->>'sixMonthGoal' AS six_month_goal_title,
    updated_at
FROM ai_recommendation_archive
WHERE original_recommendation_id = '2c919438-bdd3-485d-8c9e-b28cabcfb006'
   OR archived_goal_data->0->>'sixMonthGoal' = '매주 가족과 활동하기';

-- Step 6: Clean up test data
DELETE FROM rehabilitation_goals
WHERE title = '매주 가족과 활동하기'
  AND goal_type = 'six_month'
  AND created_at >= CURRENT_DATE;

-- Step 7: Check archive stats after hard DELETE (should still show usage_count = 0)
SELECT 
    id,
    archived_reason,
    usage_count,
    completion_count,
    archived_goal_data->0->>'sixMonthGoal' AS six_month_goal_title,
    updated_at
FROM ai_recommendation_archive
WHERE original_recommendation_id = '2c919438-bdd3-485d-8c9e-b28cabcfb006'
   OR archived_goal_data->0->>'sixMonthGoal' = '매주 가족과 활동하기';