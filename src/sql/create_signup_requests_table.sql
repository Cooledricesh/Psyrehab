-- 회원가입 신청 테이블 생성
CREATE TABLE IF NOT EXISTS signup_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('social_worker', 'administrator')),
    employee_id TEXT,
    department TEXT,
    contact_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT
);

-- RLS 활성화
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 누구나 자신의 신청서를 생성할 수 있음
CREATE POLICY "Anyone can create signup request"
ON signup_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 신청서를 볼 수 있음
CREATE POLICY "Users can view own signup requests"
ON signup_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS 정책: 관리자는 모든 신청서를 볼 수 있음
CREATE POLICY "Admins can view all signup requests"
ON signup_requests
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    )
);

-- RLS 정책: 관리자는 신청서를 업데이트할 수 있음
CREATE POLICY "Admins can update signup requests"
ON signup_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    )
);

-- 인덱스 생성
CREATE INDEX idx_signup_requests_status ON signup_requests(status);
CREATE INDEX idx_signup_requests_user_id ON signup_requests(user_id);
CREATE INDEX idx_signup_requests_created_at ON signup_requests(created_at DESC);
