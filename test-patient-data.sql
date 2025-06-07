-- 테스트용 환자 데이터 삽입
INSERT INTO patients (
  patient_identifier,
  full_name,
  birth_date,
  gender,
  diagnosis,
  diagnosis_code,
  diagnosis_date,
  initial_diagnosis_date,
  phone_number,
  emergency_contact,
  address,
  primary_social_worker_id,
  status,
  created_at,
  updated_at
) VALUES 
(
  'P001',
  '김영수',
  '1958-03-15',
  'male',
  '우울증',
  'F32.9',
  '1998-06-20',
  '1998-06-20',
  '010-1234-5678',
  '{"name": "김미영", "relationship": "배우자", "phone": "010-9876-5432"}',
  '{"address": "서울시 강남구 테헤란로 123", "zipcode": "06142"}',
  1,
  'active',
  NOW(),
  NOW()
),
(
  'P002',
  '이미영',
  '1965-08-22',
  'female',
  '조현병',
  'F20.9',
  '2005-11-10',
  '2005-11-10',
  '010-2345-6789',
  '{"name": "이철수", "relationship": "형제", "phone": "010-8765-4321"}',
  '{"address": "서울시 서초구 서초대로 456", "zipcode": "06654"}',
  1,
  'active',
  NOW(),
  NOW()
),
(
  'P003',
  '박준호',
  '1972-12-05',
  'male',
  '양극성 장애',
  'F31.9',
  '2010-03-18',
  '2010-03-18',
  '010-3456-7890',
  '{"name": "박수진", "relationship": "배우자", "phone": "010-7654-3210"}',
  '{"address": "서울시 마포구 월드컵로 789", "zipcode": "03925"}',
  1,
  'active',
  NOW(),
  NOW()
),
(
  'P004',
  '최서연',
  '1980-07-11',
  'female',
  '불안장애',
  'F41.9',
  '2015-09-25',
  '2015-09-25',
  '010-4567-8901',
  '{"name": "최민수", "relationship": "부모", "phone": "010-6543-2109"}',
  '{"address": "서울시 송파구 올림픽로 321", "zipcode": "05551"}',
  1,
  'active',
  NOW(),
  NOW()
);

-- assessments 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  focus_time VARCHAR(20) NOT NULL,
  motivation_level INTEGER NOT NULL CHECK (motivation_level >= 1 AND motivation_level <= 10),
  past_successes TEXT[] NOT NULL DEFAULT '{}',
  past_successes_other TEXT DEFAULT '',
  constraints TEXT[] NOT NULL DEFAULT '{}',
  constraints_other TEXT DEFAULT '',
  social_preference VARCHAR(20) NOT NULL,
  assessment_date DATE NOT NULL,
  assessed_by INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ai_goal_recommendations 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS ai_goal_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  assessment_id UUID,
  goals JSONB NOT NULL,
  strategies JSONB,
  recommendations JSONB,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
); 