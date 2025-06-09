🎯 목표설정 시스템 분석 및 개발 계획
현재 상황 분석
✅ 완비된 데이터베이스 구조
rehabilitation_goals: 매우 복잡한 목표 테이블 (30개 컬럼)
goal_categories: 7개 카테고리 이미 설정됨 (일상생활, 사회적 관계, 직업 역량 등)
ai_goal_recommendations: AI 추천 시스템 구조 완비
goal_evaluations: 목표 평가 시스템
weekly_check_ins: 주간 체크인 시스템
goal_history: 목표 변경 이력 추적
⚠️ 문제점: 완전히 하드코딩된 UI
현재 GoalSetting.tsx는 완전히 정적인 하드코딩:
환자 선택: "김○○", "이○○", "박○○" 하드코딩
목표 범주: "사회적응", "직업재활" 등 하드코딩
AI 추천 목표: 3개 고정 하드코딩
최근 목표: 3개 고정 하드코딩
폼 제출: 아무 동작 없음
✅ 완비된 서비스 레이어
rehabilitation-goals.ts: 600줄의 완전한 서비스 함수들
React Query 훅들도 완비됨
복잡한 goal 컴포넌트들 이미 구현됨
🚀 개발 계획
Phase 1: 기본 목표 설정 기능 (1-2일)
환자 선택 드롭다운
실제 환자 데이터 연동
getPatients() 활용
목표 범주 드롭다운
goal_categories 테이블에서 실제 데이터 로드
색상/아이콘 표시
목표 저장 기능
createRehabilitationGoal() 연동
폼 검증 및 에러 처리
최근 목표 목록
getRecentRehabilitationGoals() 연동
실제 진행률 표시
Phase 2: AI 추천 시스템 연동 (2-3일)
AI 추천 목표 표시
ai_goal_recommendations 테이블에서 데이터 로드
추천 목표 클릭 시 폼에 자동 입력
AI 추천 적용 기능
추천된 목표를 실제 목표로 변환
createGoalsFromAIRecommendation() 활용
Phase 3: 고급 기능 (3-4일)
목표 계층 구조
6개월/월간/주간 목표 계층
goal_type 및 parent_goal_id 활용
목표 진행률 대시보드
통계 및 차트 표시
getGoalStatistics() 활용
목표 평가 시스템
주간 체크인 기능
진행률 업데이트
Phase 4: 목표 관리 고도화 (2-3일)
목표 상세 보기/편집
기존 GoalForm.tsx 컴포넌트 활용
목표 이력 추적
목표 필터링/검색
상태별, 카테고리별 필터
기존 GoalFilters.tsx 활용
🔧 즉시 시작할 수 있는 작업
환자 선택 드롭다운 실제 데이터 연동
목표 범주 실제 데이터 연동
목표 저장 기능 구현
이 시스템은 데이터베이스 구조와 서비스 레이어가 이미 완비되어 있어서, UI만 실제 데이터에 연결하면 됩니다.
어떤 부분부터 시작하시겠습니까? 기본적인 CRUD 기능부터 시작해서 점진적으로 고도화하는 것을 추천합니다.