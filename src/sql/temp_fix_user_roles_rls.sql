-- 임시 해결책: 회원가입 시 누구나 user_roles에 insert 가능하도록 정책 추가
-- 프로덕션에서는 더 안전한 방법 필요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON user_roles;
DROP POLICY IF EXISTS "Anyone can insert during signup" ON user_roles;

-- 새로운 정책: 인증되지 않은 사용자도 회원가입 시 역할 추가 가능
CREATE POLICY "Anyone can insert during signup" 
ON user_roles 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 관리자만 user_roles를 수정/삭제할 수 있도록 제한
CREATE POLICY "Only admins can update user_roles" 
ON user_roles 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    )
);

CREATE POLICY "Only admins can delete user_roles" 
ON user_roles 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = 'd7fcf425-85bc-42b4-8806-917ef6939a40'
    )
);
