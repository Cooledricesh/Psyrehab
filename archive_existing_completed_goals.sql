-- 기존 완료된 목표들을 아카이빙하는 스크립트

-- 먼저 완료된 6개월 목표들 확인
SELECT 
    rg.id,
    rg.title,
    rg.status,
    rg.completion_date,
    rg.actual_completion_rate,
    p.full_name as patient_name,
    p.birth_date,
    p.gender,
    p.diagnosis
FROM rehabilitation_goals rg
JOIN patients p ON p.id = rg.patient_id
WHERE rg.goal_type = 'six_month' 
AND rg.status = 'completed'
ORDER BY rg.completion_date DESC;

-- 위 목표들을 아카이빙하려면 아래 함수를 실행
-- 각 목표에 대해 archiveCompletedGoal 함수를 호출해야 하는데,
-- JavaScript 함수이므로 SQL로 직접 실행할 수 없습니다.
-- 대신 다음과 같은 방법을 사용할 수 있습니다:

-- 1. Progress Tracking에서 수동으로 각 목표를 다시 완료 처리
-- 2. 또는 아래 스크립트를 사용해서 브라우저 콘솔에서 실행