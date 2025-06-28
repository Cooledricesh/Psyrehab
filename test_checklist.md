# 완료된 목표 아카이빙 기능 테스트 체크리스트

## 1. 데이터베이스 확인
- [ ] `ai_recommendation_archive` 테이블에 `completion_rate` 컬럼 존재
- [ ] `ai_recommendation_archive` 테이블에 `completion_date` 컬럼 존재
- [ ] 인덱스가 정상적으로 생성됨

## 2. 목표 완료 시 자동 아카이빙 테스트
1. Progress Tracking 페이지로 이동
2. 환자 선택
3. 주간 목표들을 모두 완료 처리
4. 6개월 목표 완료 확인 대화상자에서 "네, 달성했습니다" 클릭
5. 브라우저 콘솔에서 "✅ 완료된 6개월 목표 자동 아카이빙 성공" 메시지 확인

## 3. 아카이빙된 목표 검색 테스트
1. Goal Setting 페이지로 이동
2. inactive 상태의 환자 선택
3. 평가 완료 후 아카이빙된 목표 선택 화면 확인
4. 성공적으로 완료된 목표가 상단에 표시되는지 확인
5. "✓ 성공적으로 완료됨 (달성률: XX%)" 표시 확인

## 4. 에러 확인
- [ ] 콘솔에 400 Bad Request 오류 없음
- [ ] "column does not exist" 오류 없음

## 5. 데이터 확인 SQL
```sql
-- 아카이빙된 데이터 확인
SELECT 
    id,
    archived_reason,
    completion_rate,
    completion_date,
    patient_age_range,
    patient_gender,
    diagnosis_category,
    archived_goal_data->0->>'title' as goal_title
FROM ai_recommendation_archive
ORDER BY 
    CASE WHEN archived_reason = 'successfully_completed' THEN 0 ELSE 1 END,
    completion_rate DESC NULLS LAST,
    archived_at DESC
LIMIT 10;

-- 완료된 목표 중 아직 아카이빙되지 않은 목표 확인
SELECT 
    id,
    title,
    actual_completion_rate,
    completion_date
FROM rehabilitation_goals
WHERE goal_type = 'six_month' 
AND status = 'completed'
AND id NOT IN (
    SELECT original_recommendation_id::uuid 
    FROM ai_recommendation_archive 
    WHERE original_recommendation_id IS NOT NULL
);
```