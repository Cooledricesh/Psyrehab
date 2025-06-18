-- user_roles 테이블에 대한 RLS 정책 수정
-- 회원가입 시 사용자가 자신의 역할을 설정할 수 있도록 허용

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON user_roles;

-- 새로운 정책 생성
-- 1. 인증된 사용자가 자신의 역할을 삽입할 수 있도록 허용
CREATE POLICY "Enable insert for authenticated users during signup" 
ON user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. 사용자가 자신의 역할을 조회할 수 있도록 허용
CREATE POLICY "Users can view their own roles" 
ON user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 3. 관리자는 모든 역할을 조회할 수 있도록 허용
CREATE POLICY "Admins can view all roles" 
ON user_roles 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40' -- administrator role
    )
);

-- social_workers 테이블에 대한 RLS 정책
DROP POLICY IF EXISTS "Enable insert for users during signup" ON social_workers;
DROP POLICY IF EXISTS "Social workers can insert their own profile" ON social_workers;

CREATE POLICY "Social workers can insert their own profile" 
ON social_workers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Social workers can view their own profile" 
ON social_workers 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR is_social_worker() OR is_administrator());

CREATE POLICY "Social workers can update their own profile" 
ON social_workers 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- administrators 테이블에 대한 RLS 정책
DROP POLICY IF EXISTS "Enable insert for admin users during signup" ON administrators;
DROP POLICY IF EXISTS "Admins can insert their own profile" ON administrators;

CREATE POLICY "Admins can insert their own profile" 
ON administrators 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin profiles" 
ON administrators 
FOR SELECT 
TO authenticated 
USING (is_administrator() OR auth.uid() = user_id);

CREATE POLICY "Admins can update their own profile" 
ON administrators 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
