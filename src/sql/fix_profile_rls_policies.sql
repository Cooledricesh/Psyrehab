-- social_workers와 administrators 테이블의 RLS 정책 수정
-- 새로 가입한 사용자가 자신의 프로필을 생성할 수 있도록 허용

-- social_workers 테이블 정책
DROP POLICY IF EXISTS "Social workers can insert their own profile" ON social_workers;
DROP POLICY IF EXISTS "Anyone can insert their profile during signup" ON social_workers;

-- 인증된 사용자가 자신의 프로필 생성 허용
CREATE POLICY "Users can create their own social worker profile" 
ON social_workers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 프로필 조회는 본인, 사회복지사, 관리자만 가능
CREATE POLICY "View social worker profiles" 
ON social_workers 
FOR SELECT 
TO authenticated 
USING (
    auth.uid() = user_id 
    OR is_social_worker() 
    OR is_administrator()
);

-- administrators 테이블 정책
DROP POLICY IF EXISTS "Admins can insert their own profile" ON administrators;
DROP POLICY IF EXISTS "Anyone can insert their profile during signup" ON administrators;

-- 인증된 사용자가 자신의 관리자 프로필 생성 허용
CREATE POLICY "Users can create their own admin profile" 
ON administrators 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 관리자 프로필 조회는 관리자만 가능
CREATE POLICY "View admin profiles" 
ON administrators 
FOR SELECT 
TO authenticated 
USING (
    is_administrator() 
    OR auth.uid() = user_id
);

-- user_roles 테이블은 관리자만 INSERT 가능하도록 유지
DROP POLICY IF EXISTS "Anyone can insert during signup" ON user_roles;

CREATE POLICY "Only admins can insert user roles" 
ON user_roles 
FOR INSERT 
TO authenticated 
USING (is_administrator());

-- 사용자가 자신의 역할을 확인할 수 있도록 SELECT는 허용
CREATE POLICY "Users can view their own roles" 
ON user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
