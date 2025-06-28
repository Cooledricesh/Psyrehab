-- 가장 최근에 완료된 6개월 목표 중 하나를 테스트로 아카이빙
-- 변진영 환자의 완료된 목표를 예시로 사용

-- 먼저 완료된 목표 확인
SELECT 
    id,
    title,
    actual_completion_rate,
    completion_date,
    patient_id
FROM rehabilitation_goals
WHERE goal_type = 'six_month' 
AND status = 'completed'
AND actual_completion_rate > 0
LIMIT 1;

-- 위 쿼리에서 나온 ID를 사용해서 아래 함수를 호출하면 됩니다
-- SELECT ai_recommendation_archive.archive_completed_goal('목표ID');