-- 기존 social_worker 관련 데이터를 백업하고 새로운 직급 체계로 마이그레이션

-- 1. 새로운 직급 역할들을 roles 테이블에 추가
INSERT INTO roles (role_name, description) VALUES
  ('staff', '사원'),
  ('assistant_manager', '주임'),
  ('section_chief', '계장'),
  ('manager_level', '과장'),
  ('department_head', '부장'),
  ('vice_director', '부원장'),
  ('director', '원장'),
  ('attending_physician', '주치의')
ON CONFLICT (role_name) DO NOTHING;

-- 2. 기존 social_worker 역할을 가진 사용자들을 staff로 변경
UPDATE user_roles 
SET role_id = (SELECT id FROM roles WHERE role_name = 'staff')
WHERE role_id = (SELECT id FROM roles WHERE role_name = 'social_worker');

-- 3. social_worker 역할을 roles 테이블에서 삭제
DELETE FROM roles WHERE role_name = 'social_worker';